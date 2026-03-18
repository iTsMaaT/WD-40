/* eslint-disable preserve-caught-error */
const { Constants, YTNodes } = require("youtubei.js");
const { Readable, PassThrough, once } = require("stream");
const { getWebPoMinter, invalidateWebPoMinter, generateDataSyncTokens } = require("./poTokenGenerator.js");
const { getInnertube } = require("./getInnertube.js");
const { toNodeReadable, makeRequest, parseM3U8, extractManifestUrl } = require("./youtubeSharedUtils.js");
const { spawn } = require("child_process");

function createFFmpegStream(input, { isUrl = false, isDash = false, logEvents = false } = {}) {
    const baseArgs = [
        "-loglevel", logEvents ? "info" : "error",

        // 🔥 universal fixes
        "-fflags", "+genpts+discardcorrupt",

        "-analyzeduration", "1M",
        "-probesize", "1M",
    ];

    let inputArgs;

    if (isUrl) {
        if (isDash) {
            // ✅ DASH (MPD)
            inputArgs = [
                "-reconnect", "1",
                "-reconnect_streamed", "1",
                "-reconnect_delay_max", "5",

                "-i", input,
                "-map", "0:a:0",
                "-rw_timeout", "15000000",
            ];
        } else {
            // ✅ HLS (M3U8)
            inputArgs = [
                "-reconnect", "1",
                "-reconnect_streamed", "1",
                "-reconnect_delay_max", "5",

                "-rw_timeout", "15000000",

                "-fflags", "+nobuffer",
                "-flags", "low_delay",

                "-i", input,
            ];
        }
    } else {
        inputArgs = [
            "-use_wallclock_as_timestamps", "1",
            "-i", "pipe:0",
        ];
    }

    const outputArgs = [
        "-vn",

        // 🔥 fix audio glitches
        "-af", "aresample=async=1:first_pts=0",

        "-c:a", "libopus",
        "-ar", "48000",
        "-ac", "2",
        "-b:a", "128k",

        "-f", "opus",
        "pipe:1",
    ];

    const args = [...baseArgs, ...inputArgs, ...outputArgs];

    const ffmpeg = spawn("ffmpeg", args, {
        stdio: ["pipe", "pipe", "pipe"],
    });

    if (!isUrl) 
        input.pipe(ffmpeg.stdin);
    

    ffmpeg.stderr.on("data", (d) => {
        // if (logEvents) console.log("[FFmpeg]", d.toString());
    });

    ffmpeg.on("close", (code) => {
        if (logEvents) console.log(`[FFmpeg] exited with code ${code}`);
    });

    return ffmpeg.stdout;
}

/**
 * Deciphers and processes manifest URLs for HLS/DASH streams
 * Based on FreeTube's implementation
 * 
 * @param {string} url - The manifest URL to decipher
 * @param {Object} player - The player instance from innertube
 * @param {string} poToken - The PO token for authentication
 * @param {boolean} isDash - Whether this is a DASH manifest (vs HLS)
 * @returns {Promise<string>} The deciphered and processed manifest URL
 */
async function decipherManifestUrl(url, player, poToken, isDash) {
    const urlObject = new URL(url);

    if (urlObject.searchParams.size > 0) {
        urlObject.searchParams.set("pot", poToken);

        if (isDash) 
            urlObject.searchParams.set("mpd_version", "7");
        

        return await player.decipher(urlObject.toString());
    }

    const pathPrefix = isDash ? "/api/manifest/dash" : "/api/manifest/hls_variant";

    // Convert path params to query params
    const pathParts = urlObject.pathname
        .replace(pathPrefix, "")
        .split("/")
        .filter(part => part.length > 0);

    urlObject.pathname = pathPrefix;

    for (let i = 0; i + 1 < pathParts.length; i += 2) 
        urlObject.searchParams.set(pathParts[i], decodeURIComponent(pathParts[i + 1]));
    

    // decipher
    const deciphered = await player.decipher(urlObject.toString());

    // convert query parameters back to path parameters
    const decipheredUrlObject = new URL(deciphered);

    for (const [key, value] of decipheredUrlObject.searchParams) 
        decipheredUrlObject.pathname += `/${key}/${encodeURIComponent(value)}`;
    

    decipheredUrlObject.search = "";
    decipheredUrlObject.pathname += `/pot/${encodeURIComponent(poToken)}`;

    if (isDash) 
        decipheredUrlObject.pathname += "/mpd_version/7";
    

    return decipheredUrlObject.toString();
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
    const player = innertube.session.player;
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
    const contentPoToken = await minter.mint(videoId);
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
                signatureTimestamp: player?.signature_timestamp,
            },
        },
        contentCheckOk: true,
        racyCheckOk: true,
        serviceIntegrityDimensions: { poToken: poToken },
        parse: true,
    });

    // === Extract and decipher manifest URL ===
    let manifestUrl = null;
    let isDash = true;

    if (playerResponse.streaming_data?.hls_manifest_url) {
        manifestUrl = playerResponse.streaming_data.hls_manifest_url;
        isDash = false;
    } else if (playerResponse.streaming_data?.dash_manifest_url) {
        manifestUrl = playerResponse.streaming_data.dash_manifest_url;
        isDash = true;
    } 

    if (!manifestUrl) 
        throw new Error("No HLS/DASH manifest URL found in player response. Video might not be a livestream or may be streaming restricted.");
    

    if (logEvents) console.log(`[Livestream] Manifest URL extracted: ${manifestUrl.substring(0, 80)}...`);

    // === Decipher manifest URL ===
    if (!player) 
        throw new Error("Player not available for deciphering manifest URL");
    

    let decipheredManifestUrl;
    try {
        decipheredManifestUrl = await decipherManifestUrl(
            manifestUrl,
            player,
            contentPoToken,
            isDash,
        );
        if (logEvents) console.log("[Livestream] Manifest URL deciphered successfully");
    } catch (err) {
        if (logEvents) console.error("[Livestream] Error deciphering manifest URL:", err);
        throw new Error(`Failed to decipher manifest URL: ${err.message}`);
    }

    // === Stream setup ===
    const stream = createFFmpegStream(decipheredManifestUrl, {
        isUrl: true,
        isDash,
        logEvents,
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
};
