const { Constants, YTNodes } = require("youtubei.js");
const { EnabledTrackTypes, buildSabrFormat } = require("googlevideo/utils");
const { SabrStream } = require("googlevideo/sabr-stream");
const { Readable } = require("stream");
const { getWebPoMinter, invalidateWebPoMinter, generateDataSyncTokens } = require("./poTokenGenerator.js");
const { getInnertube } = require("./getInnertube.js");

const DEFAULT_OPTIONS = {
    audioQuality: "AUDIO_QUALITY_MEDIUM",
    enabledTrackTypes: EnabledTrackTypes.AUDIO_ONLY,
};

/**
 * Converts a stream to a Node.js Readable stream
 * 
 * @param {ReadableStream} stream - The stream to convert
 * @returns {Readable} The Node.js Readable stream
 */
function toNodeReadable(stream) {
    if (!stream) return null;
    if (typeof stream.pipe === "function") return stream;
    if (typeof stream.getReader === "function") {
        const reader = stream.getReader();
        const iterable = (async function* () {
            try {
                while (true) {
                    const { value, done } = await reader.read();
                    if (done) break;
                    if (value !== undefined) yield value;
                }
            } finally {
                reader.releaseLock?.();
            }
        })();
        return Readable.from(iterable);
    }
    if (Symbol.asyncIterator in stream) return Readable.from(stream);
    throw new TypeError("Unsupported stream type returned from SABR");
}

/**
 * Creates a SABR stream for a given video ID
 * 
 * @param {string} videoId - The video ID
 * @returns {Promise<Readable>} The SABR stream
 */
async function createSabrStream(videoId) {
    const innertube = await getInnertube();
    let accountInfo = null;

    // === Mint initial PO token ===
    try {
        accountInfo = await innertube.account.getInfo();
    } catch (e) {   
        accountInfo = null;
    }
    const dataSyncId = accountInfo?.contents?.contents[0]?.endpoint?.payload?.supportedTokens?.[2]?.datasyncIdToken?.datasyncIdToken ?? innertube.session.context.client.visitorData;
    const minter = await getWebPoMinter(innertube);
    const contentPoToken = await minter.mint(videoId);
    const poToken = await minter.mint(dataSyncId);

    // === Player request ===
    const watchEndpoint = new YTNodes.NavigationEndpoint({ watchEndpoint: { videoId } });
    const playerResponse = await watchEndpoint.call(innertube.actions, {
        playbackContext: {
            adPlaybackContext: { pyv: true },
            contentPlaybackContext: {
                vis: 0,
                splay: false,
                lactMilliseconds: "-1",
                signatureTimestamp: innertube.session.player?.sts,
            },
        },
        contentCheckOk: true,
        racyCheckOk: true,
        serviceIntegrityDimensions: { poToken: contentPoToken },
        parse: true,
    });

    const serverAbrStreamingUrl = innertube.session.player?.decipher(
        playerResponse.streaming_data?.server_abr_streaming_url,
    );
    const videoPlaybackUstreamerConfig =
    playerResponse.player_config?.media_common_config
        .media_ustreamer_request_config?.video_playback_ustreamer_config;

    if (!videoPlaybackUstreamerConfig) throw new Error("ustreamerConfig not found");
    if (!serverAbrStreamingUrl) throw new Error("serverAbrStreamingUrl not found");

    const sabrFormats = playerResponse.streaming_data?.adaptive_formats.map(buildSabrFormat) || [];

    const serverAbrStream = new SabrStream({
        formats: sabrFormats,
        serverAbrStreamingUrl,
        videoPlaybackUstreamerConfig,
        poToken: poToken,
        clientInfo: {
            clientName: parseInt(Constants.CLIENT_NAME_IDS[innertube.session.context.client.clientName]),
            clientVersion: innertube.session.context.client.clientVersion,
        },
    });

    // === Stream protection handling ===
    let protectionFailureCount = 0;
    let lastStatus = null;
    serverAbrStream.on("streamProtectionStatusUpdate", async (statusUpdate) => {
        if (statusUpdate.status !== lastStatus) {
            console.log("Stream Protection Status Update:", statusUpdate);
            lastStatus = statusUpdate.status;
        }
        if (statusUpdate.status === 2) {
            protectionFailureCount = Math.min(protectionFailureCount + 1, 10);
            if (protectionFailureCount === 1 || protectionFailureCount % 5 === 0) 
                console.log(`Rotating PO token... (attempt ${protectionFailureCount})`);
        
            try {
                const rotationMinter = await getWebPoMinter(innertube, { forceRefresh: protectionFailureCount >= 3 });
                const placeholderToken = rotationMinter.generatePlaceholder(videoId);
                serverAbrStream.setPoToken(placeholderToken);
                const mintedPoToken = await rotationMinter.mint(videoId);
                serverAbrStream.setPoToken(mintedPoToken);
            } catch (err) {
                if (protectionFailureCount === 1 || protectionFailureCount % 5 === 0) 
                    console.error("Failed to rotate PO token:", err);
            
            }
        } else if (statusUpdate.status === 3) {
            console.error("Stream protection rejected token (SPS 3). Resetting Botguard.");
            invalidateWebPoMinter();
        } else {
            protectionFailureCount = 0;
        }
    });

    serverAbrStream.on("error", (err) => {
        console.error("SABR stream error:", err);
    });

    // === Start SABR stream ===
    const { audioStream } = await serverAbrStream.start(DEFAULT_OPTIONS);
    const nodeStream = toNodeReadable(audioStream);

    return nodeStream;
}

module.exports = {
    createSabrStream,
};
