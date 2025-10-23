const { Player, AudioFilters, onBeforeCreateStream } = require("discord-player");
const { AttachmentExtractor } = require("@discord-player/extractor");
const { YoutubeiExtractor, stream } = require("discord-player-youtubei");
const { DeezerExtractor, NodeDecryptor, JSDecryptor } = require("discord-player-deezer");
const { SoundgasmExtractor } = require("discord-player-soundgasm");
const { TTSExtractor } = require("discord-player-tts");
const { SoundcloudExtractor } = require("discord-player-soundcloud");
const { SpotifyExtractor } = require("discord-player-spotify");
const { AppleMusicExtractor } = require("discord-player-applemusic");
const { SubsonicExtractor } = require("discord-player-subsonic");
const { distubePluginToExtractor } = require("@utils/helpers/distubePluginToDiscordPlayerExtractor.js");
const { YoutubePlugin } = require("./distubeYoutubeExtractor.js");
const { Innertube, ClientType } = require("youtubei.js");
const { YoutubeSabrExtractor } = require("./youtubei/youtubeiExtractor.js");
const ytdl = require("@distube/ytdl-core");
const config = require("@utils/config/configUtils");
const logger = require("@utils/log");

const { Log } = require("youtubei.js");
Log.setLevel(Log.Level.NONE);

const discordPlayerConfig = config.get("discordPlayer");
const extractors = discordPlayerConfig?.extractors || {};

/**
 * Initializes a new Player instance
 * 
 * @param {Client} client 
 * @returns 
 */
async function initPlayer(client) {
    return new Player(client, {
        skipFFmpeg: discordPlayerConfig?.skipFFmpeg,
        ffmpegPath: discordPlayerConfig?.ffmpegPath,
    });
}

/**
 * Registers all extractors
 * 
 * @param {Player} player 
 * @returns 
 */
async function registerExtractors(player) {
    const innerTubeInstance = await Innertube.create({
        client_type: ClientType.TV_EMBEDDED,
    });

    innerTubeInstance.session.signIn(tokenToObject(process.env.YOUTUBE_ACCESS_STRING));
    const ffmpegFilters = discordPlayerConfig?.ffmpegFilters || {};
    for (const filter of Object.entries(ffmpegFilters)) AudioFilters.define(filter[0], filter[1]);

    onBeforeCreateStream(async (track, queryType, queue) => {
        try {
            if (track.extractor.identifier === DeezerExtractor.identifier ||
                track.extractor.identifier === SoundcloudExtractor.identifier ||
                track.extractor.identifier === YoutubeiExtractor.identifier ||
                track.extractor.identifier === SubsonicExtractor.identifier ||
                track.extractor.identifier === TTSExtractor.identifier
            ) return await track.extractor?.stream(track);
            return undefined;
        } catch {
            return undefined;
        }
    });

    // const distubeExt = await player.extractors.register(distubePluginToExtractor(YouTubePlugin, { }));
    // distubeExt.priority = extractors.Youtubei.priority ?? distubeExt.priority;

    if (extractors.Subsonic.enabled) {
        const subsonicExt = await player.extractors.register(SubsonicExtractor, {
            username: process.env.SUBSONIC_USERNAME,
            password: process.env.SUBSONIC_PASSWORD,
            host: process.env.SUBSONIC_URL,
        });
        subsonicExt.priority = extractors.Subsonic.priority ?? subsonicExt.priority;
    }
    
    if (extractors.Soundgasm.enabled) {
        logger.info("Loading SoundgasmExtractor extractor...");
        const soundgasmExt = await player.extractors.register(SoundgasmExtractor, extractors.Soundgasm.config);
        soundgasmExt.priority = extractors.Soundgasm.priority ?? soundgasmExt.priority;
    }

    if (extractors.Soundcloud.enabled) {
        logger.info("Loading Soundcloud extractor...");
        const soundcloudExt = await player.extractors.register(SoundcloudExtractor, extractors.Soundcloud.config);
        soundcloudExt.priority = extractors.Soundcloud.priority ?? soundcloudExt.priority;
    }

    if (extractors.Youtubei.enabled || extractors.Youtubei.config.attemptYoutubeSearchEvenIfDisabled.useScraping) {
        logger.info("Loading YoutubeiExtractor extractor...");
        if (extractors.Youtubei.config.useSabrAlternative) {
            const ytExt = await player.extractors.register(YoutubeSabrExtractor, { cookies: process.env.YOUTUBE_COOKIE, logSabrEvents: extractors.Youtubei.config.logSabrEvents });
            ytExt.priority = extractors.Youtubei.priority ?? ytExt.priority;
        } else {
        
            const tempYtExt = await player.extractors.register(YoutubeiExtractor, {
                ...getYoutubeExtractorOptions(extractors.Youtubei.config),
            });

            const originalStream = tempYtExt.stream.bind(tempYtExt);

            await player.extractors.unregister(YoutubeiExtractor.identifier);

            let ytExt = null;
            try {
                ytExt = await player.extractors.register(YoutubeiExtractor, {
                    ...getYoutubeExtractorOptions(extractors.Youtubei.config),
                    createStream: async (track, ext) => {
                        try {
                            if (extractors.Youtubei.config.useTVOAuthLogin) {
                                try {
                                    const videoId = new URL(track.url).searchParams.get("v");
                                    const info = await innerTubeInstance.getBasicInfo(videoId, {
                                        client: "TV",
                                    });
                                    let format;
                                    if (info.basic_info.is_live) {
                                        format = info.streaming_data.hls_manifest_url;
                                    } else {
                                        const format251 = info.streaming_data.adaptive_formats.find(
                                            (f) => f.itag === 251,
                                        );
                                        format = format251.decipher(this.yt.session.player);
                                    }
                                    if (!format) throw new DisTubeError("NO_STREAM_URL");
                                    return format;
                                } catch (error) {
                                    logger.error("Failed to get video info from TV OAuth:", error);
                                }
                            } else {
                                if (!extractors.Youtubei.enabled && extractors.Youtubei.config.attemptYoutubeSearchEvenIfDisabled.useScraping) return null;  
                                try {
                                    return await originalStream(track, ext);
                                } catch (err) {
                                    logger.warning(`Original stream failed for ${track.url}, falling back to ytdl-core. Error: ${err.message}`);
                                }
                            }
                        } catch (mainErr) {
                            logger.error("Main Youtube stream method failed:", mainErr);
                        }

                        if (!extractors.Youtubei.config.useYTDLFallback) return null;
                        try {
                            const info = await ytdl.getInfo(track.url);
                            if (!info.formats?.length) return null;
                            const format = info.formats
                                .filter(f => f.hasAudio && (!track.live || f.isHLS))
                                .sort((a, b) => Number(b.audioBitrate) - Number(a.audioBitrate) || Number(a.bitrate) - Number(b.bitrate))[0];
                            if (!format) return null;
                            return format.url;
                        } catch (ytdlErr) {
                            logger.error("ytdl-core also failed:", ytdlErr);
                            return null;
                        }
                    },
                });

                if (!ytExt) 
                    logger.error("YoutubeiExtractor registration returned null.");
                else 
                    ytExt.priority = extractors.Youtubei.priority ?? ytExt.priority;
            } catch (e) {
                logger.error("Failed to register YoutubeiExtractor:", e);
            }
        }
    }

    if (extractors.Deezer.enabled) {
        logger.info("Loading Deezer extractor...");
        const deezerExt = await player.extractors.register(DeezerExtractor, getDeezerExtractorOptions(extractors.Deezer.config));
        deezerExt.priority = extractors.Deezer.priority ?? deezerExt.priority;
    }

    if (extractors.Spotify.enabled) {
        logger.info("Loading SpotifyExtractor extractor...");
        const spotifyExt = await player.extractors.register(SpotifyExtractor, getSpotifyExtractorOptions(extractors.Spotify.config));
        spotifyExt.priority = extractors.Spotify.priority ?? spotifyExt.priority;
    }

    if (extractors.AppleMusic.enabled) {
        logger.info("Loading AppleMusicExtractor extractor...");
        const appleMusicExt = await player.extractors.register(AppleMusicExtractor, extractors.AppleMusic.config);
        appleMusicExt.priority = extractors.AppleMusic.priority ?? appleMusicExt.priority;
    }

    if (extractors.TTS.enabled) {
        logger.info("Loading TTSExtractor extractor...");
        const ttsExt = await player.extractors.register(TTSExtractor, extractors.TTS.config);
        ttsExt.priority = extractors.TTS.priority ?? ttsExt.priority;
    }

    if (extractors.Attachment.enabled) {
        logger.info("Loading Attachment extractor...");
        const attachmentExt = await player.extractors.register(AttachmentExtractor, extractors.Attachment.config);
        attachmentExt.priority = extractors.Attachment.priority ?? attachmentExt.priority;
    }
}

/**
 * Reloads all extractors
 * 
 * @param {Player} player 
 * @returns
 */
async function reload(player) {
    await player.extractors.unregisterAll();
    await registerExtractors(player);
}

/**
 * Gets the Youtube extractor options
 * 
 * @param {object} playerconfig 
 * @returns 
 */
function getYoutubeExtractorOptions(playerconfig) {
    const options = {
        streamOptions: {
            useClient: playerconfig?.client || "IOS",
            highWaterMark: playerconfig?.highWaterMark || 1024 * 1024,
        },
    };

    if (playerconfig?.useTVOAuthLogin)
        options.authentication = process.env.YOUTUBE_ACCESS_STRING;

    if (playerconfig?.useCookie) 
        options.cookie = process.env.YOUTUBE_COOKIE;
    
    if (playerconfig?.useServerAbrStream) {
        options.useServerAbrStream = true;
        if (!playerconfig?.usePoToken) playerconfig.usePoToken = true;
    }

    if (playerconfig?.usePoToken) {
        if (!["WEB", "WEB_EMBEDDED"].includes(playerconfig?.client))
            options.streamOptions.useClient = "WEB";
        options.generateWithPoToken = true;
    }

    return options;
}

/**
 * Gets the Deezer extractor options
 * 
 * @param {object} playerconfig 
 * @returns 
 */
function getDeezerExtractorOptions(playerconfig) {
    const options = {
        decryptor: NodeDecryptor,
        reloadUserInterval: playerconfig?.reloadUserInterval || 32400000,
    };

    if (playerconfig?.useAccount) {
        options.arl = process.env.DEEZER_ARL_COOKIE;
        options.decryptionKey = process.env.DEEZER_MASTER_KEY;
    }

    return options;
}

/**
 * Gets the Spotify extractor options
 * 
 * @param {object} playerconfig 
 * @returns 
 */
function getSpotifyExtractorOptions(playerconfig) {
    const options = {};

    if (playerconfig?.useAccount) {
        options.clientId = process.env.SPOTIFY_CLIENT_ID;
        options.clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    }

    return options;
}

function tokenToObject(token) {
    if (!token.includes("; ") || !token.includes("=")) {
        throw new Error(
            "Error: this is not a valid authentication token. Make sure you are putting the entire string instead of just what's behind access_token=",
        );
    }

    const kvPair = token.split("; ");

    const validKeys = [
        "access_token",
        "expiry_date",
        "expires_in",
        "refresh_token",
        "scope",
        "token_type",
        "client",
    ];
    // @ts-ignore
    const finalObject = {};
    for (const kv of kvPair) {
        const [key, value] = kv.split("=");
        if (!validKeys.includes(key)) continue;
        // @ts-expect-error
        finalObject[key] = Number.isNaN(Number(value))
            ? value
            : Number(value);
    }

    // perform final checks
    const requiredKeys = ["access_token", "expiry_date", "refresh_token"];

    for (const key of requiredKeys) {
        if (!(key in finalObject)) {
            throw new Error(
                `Error: Invalid authentication keys. Missing the required key ${key}. Make sure you are putting the entire string instead of just what's behind access_token=`,
            );
        }
    }

    return finalObject;
}

module.exports = { initPlayer, registerExtractors, reload };