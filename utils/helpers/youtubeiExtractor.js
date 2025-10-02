// YoutubeSabrExtractor.js
const { BaseExtractor, Track, Util } = require("discord-player");
const { PassThrough } = require("stream");
const { JSDOM } = require("jsdom");
const { BG } = require("bgutils-js");
const { SabrStream } = require("googlevideo/sabr-stream");
const { Constants } = require("youtubei.js");
const { Innertube, UniversalCache, ClientType, YTNodes } = require("youtubei.js");
const { Readable } = require("stream"); // Add this for Node Readable

// Botguard requestKey you provided
const DEFAULT_REQUEST_KEY = "O43z0dpjhgX20SCx4KAo";

/**
 * Generate a poToken string using bgutils-js and jsdom, given an identifier
 * (datasyncIdToken).
 */
async function generatePoTokenForIdentifier(identifier, requestKey = DEFAULT_REQUEST_KEY, fetchImpl = globalThis.fetch) {
    if (!identifier) throw new Error("generatePoToken: missing identifier");
    // minimal DOM for the BotGuard VM
    const dom = new JSDOM("");
    Object.assign(globalThis, {
        window: dom.window,
        document: dom.window.document,
    });

    const bgConfig = {
        fetch: (input, init) => fetchImpl(input, init),
        globalObj: globalThis,
        identifier,
        requestKey,
    };

    const bgChallenge = await BG.Challenge.create(bgConfig);
    if (!bgChallenge) throw new Error("BG.Challenge.create returned nothing");

    const interpreterJavascript = bgChallenge.interpreterJavascript?.privateDoNotAccessOrElseSafeScriptWrappedValue;
    if (!interpreterJavascript) throw new Error("BG VM script not provided");

    // Patch missing global functions expected by Botguard VM
    if (typeof globalThis.rk !== "function") {
        globalThis.rk = () => {};
        if (globalThis.window) globalThis.window.rk = globalThis.rk;
        console.debug("[youtube-sabr] Patched globalThis.rk and window.rk");
    } else if (globalThis.window && typeof globalThis.window.rk !== "function") {
        globalThis.window.rk = globalThis.rk;
        console.debug("[youtube-sabr] Patched window.rk");
    }
    // execute VM boot code (it will attach BG runtime into global scope)
    new Function(interpreterJavascript)();

    const poTokenResult = await BG.PoToken.generate({
        program: bgChallenge.program,
        globalName: bgChallenge.globalName,
        bgConfig,
    });

    // BG.PoToken.generate may return different shapes; try to extract plain string:
    if (!poTokenResult) throw new Error("BG.PoToken.generate returned nothing");
    if (typeof poTokenResult === "string") return poTokenResult;
    if (poTokenResult.poToken) return poTokenResult.poToken;
    // fallback: return JSON
    return String(poTokenResult);
}

/**
 * Extract video id helper
 */
function extractVideoId(urlOrQuery) {
    try {
    // if url
        if (typeof urlOrQuery === "string" && /^https?:\/\//.test(urlOrQuery)) {
            const u = new URL(urlOrQuery);
            const v = u.searchParams.get("v");
            if (v) return v;
            // youtu.be short link
            if (u.hostname.includes("youtu.be")) 
                return u.pathname.slice(1);
      
        }
    } catch (e) {
        // ignore
    }
    // fallback: accept plain id
    if (/^[A-Za-z0-9_-]{11}$/.test(String(urlOrQuery))) return String(urlOrQuery);
    return null;
}

/**
 * The extractor class — extends BaseExtractor as required by discord-player.
 */
class YoutubeSabrExtractor extends BaseExtractor {
    // Unique id used by discord-player
    static identifier = "youtube-sabr";

    constructor(options = {}) {
        super();
        this.options = options;
        // protocols you want to advertise (optional)
        this.protocols = ["youtube", "yt"];
        // will hold the innertube instance once activated
        this.innertube = null;
        // optional cached poToken
        this._poToken = null;
    }

    /**
   * Called by discord-player when loading your extractor.
   * Use it to create Innertube and prepare PoToken/cookie handling.
   */
    async activate() {
        // Wrap fetch to ensure URL string is always passed
        this.innertube = await Innertube.create({
            client_type: ClientType.WEB,
            cache: new UniversalCache(false),
            ...(this.options.innertubeOptions || {}),
            cookie: process.env.YOUTUBE_COOKIE,
        });

        // try to obtain datasyncIdToken from account info, then generate po token
        try {
            const userInfo = await this.innertube.account.getInfo();
            const identifier =
        userInfo?.contents?.contents?.[0]?.endpoint?.payload?.supportedTokens?.[2]
            ?.datasyncIdToken?.datasyncIdToken || null;

            if (identifier) {
                try {
                    this._poToken = await generatePoTokenForIdentifier(identifier, this.options.requestKey ?? DEFAULT_REQUEST_KEY, this.options.fetch ?? globalThis.fetch);
                    // store on innertube.session for later usage
                    if (this.innertube.session) this.innertube.session.po_token = this._poToken;
                } catch (e) {
                    // if token gen fails — keep going but warn
                    console.warn("[youtube-sabr] failed to generate poToken:", e?.message ?? e);
                }
            } else {
                // no datasync id — fine, proceed (cookies might be enough)
                console.warn("[youtube-sabr] datasyncId not found in account.getInfo()");
            }
        } catch (err) {
            // account.getInfo might require auth; ignore if not available
            console.warn(err);
        }
    }

    async deactivate() {
    // nothing special to do, but keep it symmetrical
        this.innertube = null;
        this._poToken = null;
    }

    /**
   * Determine whether this extractor can handle the query.
   * We accept youtube URLs and youtu.be links.
   */
    async validate(query, queryType) {
        if (typeof query !== "string") return false;
        if (/^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//i.test(query)) return true;
        return false;
    }

    /**
   * Resolve metadata for a query (single video URL or id).
   * Return ExtractorInfo via this.createResponse(playlist|null, [tracks])
   */
    async handle(query, context) {
        try {
            const raw = (typeof query === "string" && query.includes("://")) ? query : (query.startsWith("yt:") || query.startsWith("youtube:") ? query.split(":")[1] : query);
            const videoId = extractVideoId(raw);
            if (!videoId) return this.createResponse(null, []); // no results

            // get basic info from Innertube
            if (!this.innertube) throw new Error("Innertube not initialized; call activate()");
            const info = await this.innertube.getBasicInfo(videoId);

            // build a discord-player Track instance
            const trackObj = new Track(context.player, {
                title: info.basic_info?.title ?? `YouTube:${videoId}`,
                author: info.basic_info?.author ?? null,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                duration: Util.buildTimeCode(Util.parseMS((info.basic_info?.duration?.seconds ?? 0) * 1000)),
                source: "youtube-sabr",
                requestedBy: context.requestedBy ?? null,
                raw: {
                    basicInfo: info,
                    // we'll keep a small cache shape - optional
                    formats: {
                        executedAt: Date.now(),
                    },
                },
            });

            return this.createResponse(null, [trackObj]);
        } catch (err) {
            console.error(err);
            return this.createResponse(null, []);
        }
    }

    /**
   * Produce a stream (Node Readable or URL string) for the given discord-player Track.
   * This function uses googlevideo.ServerAbrStream to stream SABR chunks into a PassThrough.
   */
    async stream(track) {
        try {
            if (!this.innertube) throw new Error("Innertube not initialized; call activate() first");

            // Extract videoId
            const videoId = extractVideoId(track.url || track.raw?.id || "");
            if (!videoId) throw new Error("Unable to extract video id from track.url");

            // Use poToken if available
            const poToken = this.innertube.session?.po_token ?? this._poToken ?? undefined;

            // Use the new SABR stream helper
            const result = await createSabrStream(videoId, this.innertube, {
                poToken,
                cookies: process.env.YOUTUBE_COOKIE,
            });

            const { streamResults } = result;
            const { videoStream, audioStream } = streamResults;

            return {
                stream: audioStream,
            };
        }
        catch (e) {
            console.error(e);
            throw e;
        }
    }
}

async function makePlayerRequest(innertube, videoId, reloadPlaybackContext) {
    const watchEndpoint = new YTNodes.NavigationEndpoint({ watchEndpoint: { videoId } });

    const extraArgs = {
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
    };

    if (reloadPlaybackContext) 
        extraArgs.playbackContext.reloadPlaybackContext = reloadPlaybackContext;
  

    return await watchEndpoint.call(innertube.actions, { ...extraArgs, parse: true });
}

function buildSabrFormat(formatStream) {
    return {
        itag: formatStream.itag,
        lastModified: formatStream.last_modified_ms || formatStream.lastModified || "0",
        xtags: formatStream.xtags,
        width: formatStream.width,
        height: formatStream.height,
        mimeType: formatStream.mime_type || formatStream.mimeType,
        audioQuality: formatStream.audio_quality || formatStream.audioQuality,
        bitrate: formatStream.bitrate,
        averageBitrate: formatStream.average_bitrate || formatStream.averageBitrate,
        quality: formatStream.quality,
        qualityLabel: formatStream.quality_label || formatStream.qualityLabel,
        audioTrackId: formatStream.audio_track?.id || formatStream.audioTrackId,
        approxDurationMs: formatStream.approx_duration_ms || parseInt(formatStream.approxDurationMs || "0"),
        contentLength: parseInt(formatStream.contentLength || "0") || formatStream.content_length,

        // YouTube.js-specific properties.
        isDrc: formatStream.is_drc,
        isAutoDubbed: formatStream.is_auto_dubbed,
        isDescriptive: formatStream.is_descriptive,
        isDubbed: formatStream.is_dubbed,
        language: formatStream.language,
        isOriginal: formatStream.is_original,
        isSecondary: formatStream.is_secondary,
    };
}

async function createSabrStream(
    videoId,
    innertube,
    options,
) {
    // Get video metadata.
    const playerResponse = await makePlayerRequest(innertube, videoId);
    const videoTitle = playerResponse.video_details?.title || "Unknown Video";

    console.info(`
    Title: ${videoTitle}
    Duration: ${playerResponse.video_details?.duration}
    Views: ${playerResponse.video_details?.view_count}
    Author: ${playerResponse.video_details?.author}
    Video ID: ${playerResponse.video_details?.id}
  `);

    // Now get the streaming information.
    const serverAbrStreamingUrl = innertube.session.player?.decipher(playerResponse.streaming_data?.server_abr_streaming_url);
    const videoPlaybackUstreamerConfig = playerResponse.player_config?.media_common_config.media_ustreamer_request_config?.video_playback_ustreamer_config;

    if (!videoPlaybackUstreamerConfig) throw new Error("ustreamerConfig not found");
    if (!serverAbrStreamingUrl) throw new Error("serverAbrStreamingUrl not found");

    const sabrFormats = playerResponse.streaming_data?.adaptive_formats.map(buildSabrFormat) || [];

    const clientNameId = Constants.CLIENT_NAME_IDS?.[innertube.session.context.client.clientName] || "1";
    const clientVersion = innertube.session.context.client.clientVersion;
    const serverAbrStream = new SabrStream({
        formats: sabrFormats,
        serverAbrStreamingUrl,
        videoPlaybackUstreamerConfig,
        poToken: options.poToken,
        cookies: options.cookies,
        clientInfo: {
            clientName: clientNameId,
            clientVersion: clientVersion,
        },
    });

    // Handle player response reload events (e.g, when IP changes, or formats expire).
    serverAbrStream.on("reloadPlayerResponse", async (reloadPlaybackContext) => {
        const reloadPlayerResponse = await makePlayerRequest(innertube, videoId, reloadPlaybackContext);
        const reloadServerAbrStreamingUrl = innertube.session.player?.decipher(reloadPlayerResponse.streaming_data?.server_abr_streaming_url);
        const reloadVideoPlaybackUstreamerConfig = reloadPlayerResponse.player_config?.media_common_config.media_ustreamer_request_config?.video_playback_ustreamer_config;
        if (reloadServerAbrStreamingUrl && reloadVideoPlaybackUstreamerConfig) {
            serverAbrStream.setStreamingURL(reloadServerAbrStreamingUrl);
            serverAbrStream.setUstreamerConfig(reloadVideoPlaybackUstreamerConfig);
        }
    });

    const { videoStream, audioStream, selectedFormats } = await serverAbrStream.start(options);

    return {
        innertube,
        streamResults: {
            videoStream,
            audioStream,
            selectedFormats,
            videoTitle,
        },
    };
}

module.exports = { YoutubeSabrExtractor };
