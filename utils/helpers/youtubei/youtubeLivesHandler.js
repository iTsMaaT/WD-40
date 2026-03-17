const { Constants, YTNodes } = require("youtubei.js");
const { Readable, PassThrough, once } = require("stream");
const { getWebPoMinter, invalidateWebPoMinter, generateDataSyncTokens } = require("./poTokenGenerator.js");
const { getInnertube } = require("./getInnertube.js");
const { toNodeReadable, makeRequest, parseM3U8, extractManifestUrl } = require("./youtubeSharedUtils.js");

/**
 * Streams an M3U8 playlist as a continuous audio stream
 * 
 * @param {string} m3u8Url - The M3U8 playlist URL
 * @param {Object} options - Options for streaming
 * @returns {Promise<Readable>} The audio stream
 */
async function streamM3U8Stream(m3u8Url, options = {}) {
    const outputStream = new PassThrough();
    let isDestroyed = false;
    let currentSegmentIndex = 0;
    const segmentCache = new Map();
    const maxCacheSize = 5;

    const processStream = async () => {
        try {
            while (!isDestroyed) {
                try {
                    // Fetch fresh playlist periodically
                    const m3u8Content = await makeRequest(m3u8Url, {
                        headers: {
                            "Cache-Control": "no-cache",
                            "Pragma": "no-cache",
                        },
                    });

                    const baseUrl = m3u8Url.substring(0, m3u8Url.lastIndexOf("/") + 1);
                    const segments = parseM3U8(m3u8Content, baseUrl);

                    // Process segments starting from current index
                    for (let i = currentSegmentIndex; i < segments.length && !isDestroyed; i++) {
                        const segment = segments[i];

                        try {
                            let segmentData = segmentCache.get(segment.url);

                            if (!segmentData) {
                                segmentData = await makeRequest(segment.url);
                                segmentCache.set(segment.url, segmentData);

                                // Limit cache size
                                if (segmentCache.size > maxCacheSize) {
                                    const firstKey = segmentCache.keys().next().value;
                                    segmentCache.delete(firstKey);
                                }
                            }

                            if (isDestroyed) break;

                            if (!outputStream.write(Buffer.from(segmentData))) 
                                await once(outputStream, "drain");
                            

                            currentSegmentIndex = i + 1;
                        } catch (segmentError) {
                            console.error(`Error downloading segment ${i}:`, segmentError.message);
                            // Continue to next segment instead of failing
                        }
                    }

                    await new Promise(resolve => setTimeout(resolve, options.updateInterval || 10000));

                } catch (playlistError) {
                    console.error("Error fetching M3U8 playlist:", playlistError.message);
                    await new Promise(resolve => setTimeout(resolve, 5000));
                }
            }
        } finally {
            if (!isDestroyed) 
                outputStream.end();
            
        }
    };

    // Start streaming in background
    processStream().catch(err => {
        console.error("Stream processing error:", err);
        if (!isDestroyed) 
            outputStream.destroy(err);
        
    });

    // Handle stream destruction
    outputStream.on("close", () => {
        isDestroyed = true;
    });

    return outputStream;
}

/**
 * Creates a livestream from a YouTube video ID using DASH/HLS manifest
 * 
 * @param {string} videoId - The video ID
 * @param {Array<string>} cookies - Optional cookies array
 * @param {boolean} logEvents - Whether to log events
 * @returns {Promise<Readable>} The audio stream
 */
async function createLivestream(videoId, cookies = [], logEvents = false) {
    const innertube = await getInnertube(cookies);
    let accountInfo;

    // === Mint initial PO token ===
    try {
        accountInfo = await innertube.account.getInfo();
    } catch (e) {
        accountInfo = null;
    }

    const dataSyncId = accountInfo?.contents?.contents[0]?.endpoint?.payload?.supportedTokens?.[2]?.datasyncIdToken?.datasyncIdToken 
        ?? innertube.session.context.client.visitorData;
    
    const minter = await getWebPoMinter(innertube);
    const poToken = await minter.mint(dataSyncId);

    // === Player request ===
    const watchEndpoint = new YTNodes.NavigationEndpoint({ watchEndpoint: { videoId } });
    
    if (logEvents) console.log(`[Livestream] Fetching player response for video: ${videoId}`);

    const playerResponse = await watchEndpoint.call(innertube.actions, {
        playbackContext: {
            contentPlaybackContext: {
                vis: 0,
                splay: false,
                lactMilliseconds: "-1",
                signatureTimestamp: innertube.session.player?.signature_timestamp,
            },
        },
        contentCheckOk: true,
        racyCheckOk: true,
        serviceIntegrityDimensions: { poToken: poToken },
        parse: true,
    });

    // === Extract manifest URL ===
    const manifestUrl = extractManifestUrl(playerResponse);

    if (!manifestUrl) 
        throw new Error("No HLS/DASH manifest URL found in player response. Video might not be a livestream or may be streaming restricted.");
    

    if (logEvents) console.log(`[Livestream] Manifest URL extracted: ${manifestUrl.substring(0, 80)}...`);

    // === Stream setup ===
    const manifestUrlWithAuth = manifestUrl;

    const stream = await streamM3U8Stream(manifestUrlWithAuth, {
        updateInterval: 10000, 
    });

    // === Stream event handling ===
    let lastError = null;
    let errorCount = 0;

    stream.on("error", (err) => {
        if (logEvents) console.error("[Livestream] Stream error:", err);
        lastError = err;
        errorCount++;

        if (errorCount > 5) {
            if (logEvents) console.error("[Livestream] Too many errors, closing stream");
            stream.destroy();
        }
    });

    if (logEvents) console.log("[Livestream] Stream created successfully");

    return stream;
}

/**
 * Verifies if a video is a livestream
 * 
 * @param {string} videoId - The video ID
 * @param {Array<string>} cookies - Optional cookies array
 * @returns {Promise<boolean>} True if video is an active livestream
 */
async function isLivestream(videoId, cookies = []) {
    try {
        const innertube = await getInnertube(cookies);
        const info = await innertube.getBasicInfo(videoId);

        const isLive = info.basic_info?.is_live ?? false;
        const isUpcoming = info.basic_info?.is_upcoming ?? false;

        return isLive || isUpcoming;
    } catch (error) {
        console.error("Error checking if video is livestream:", error);
        return false;
    }
}

/**
 * Gets livestream information
 * 
 * @param {string} videoId - The video ID
 * @param {Array<string>} cookies - Optional cookies array
 * @returns {Promise<Object>} Livestream info object
 */
async function getLivestreamInfo(videoId, cookies = []) {
    const innertube = await getInnertube(cookies);
    const info = await innertube.getBasicInfo(videoId);
    const basicInfo = info.basic_info ?? {};

    return {
        videoId,
        title: basicInfo.title,
        author: basicInfo.author,
        duration: basicInfo.duration,
        isLive: basicInfo.is_live ?? false,
        isUpcoming: basicInfo.is_upcoming ?? false,
        viewCount: basicInfo.view_count,
        uploadDate: basicInfo.upload_date,
    };
}

module.exports = {
    createLivestream,
    isLivestream,
    getLivestreamInfo,
    streamM3U8Stream,
};
