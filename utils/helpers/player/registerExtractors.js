/* eslint-disable no-shadow */
const { Player, AudioFilters, onBeforeCreateStream, onStreamExtracted, StreamType } = require("discord-player");
const { AttachmentExtractor } = require("@discord-player/extractor");
const { YoutubeExtractor } = require("discord-player-youtubei");
const { DeezerExtractor, NodeDecryptor } = require("discord-player-deezer");
const { SoundgasmExtractor } = require("discord-player-soundgasm");
const { TTSExtractor } = require("discord-player-tts");
const { SoundcloudExtractor } = require("discord-player-soundcloud");
const { SpotifyExtractor } = require("discord-player-spotify");
const { AppleMusicExtractor } = require("discord-player-applemusic");
const { SubsonicExtractor } = require("discord-player-subsonic");
const { YoutubeSabrExtractor } = require("@utils/helpers/youtubei/youtubeiExtractor.js");
const { startInterceptor } = require("@utils/helpers/player/interceptor");
const youtubeCookieHandler = require("@utils/helpers/youtubeCookieHandler/youtubeCookieHandler");
const { FilterManager } = require("@utils/helpers/player/filterManager");
const { PassThrough, Readable } = require("stream");
const NodeAV = require("node-av");
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
    const [mediabunny, mediabunnyServer] = await Promise.all([
        import("mediabunny"),
        import("@mediabunny/server"),
    ]);
    const { ALL_FORMATS, AudioSample, AudioSampleSink, Input, ReadableStreamSource } = mediabunny;
    const { registerMediabunnyServer, toAvFrame, AvFrameAudioSampleResource } = mediabunnyServer;

    const player = new Player(client, {
        skipFFmpeg: discordPlayerConfig?.skipFFmpeg,
        ffmpegPath: discordPlayerConfig?.ffmpegPath,
    });
    if (discordPlayerConfig?.downloadStreams) startInterceptor(player);

    registerMediabunnyServer();

    /**
     * @type {WeakMap<import("discord-player").GuildQueue, number>}
     */
    const queueIndexTracker = new WeakMap();

    const OUTPUT_FORMAT = "aformat=sample_fmts=s16:sample_rates=48000:channel_layouts=stereo";

    onStreamExtracted(async (stream, _, queue) => {
        if (queue.filters.ffmpeg.filters.length > 0) return stream;

        const currentIndex = (queueIndexTracker.get(queue) ?? 0) + 1
        queueIndexTracker.set(queue, currentIndex);

        let webStream;
        let abortController;
        /** @type {Readable|null} */
        let inputStream = null;

        if (typeof stream === "string") {
            abortController = new AbortController();
            const response = await fetch(stream, {
                signal: abortController.signal,
            });
            if (!response.ok || !response.body) {
                const player = useMainPlayer();

                player.debug(`[Mediabunny]: Failed to fetch web stream using fetch. Status code ${response.status}`);

                return stream;
            }

            webStream = response.body;
        } else {
            inputStream = stream instanceof Readable ? stream : stream.stream;

            webStream = Readable.toWeb(inputStream);
        }

        const input = new Input({
            source: new ReadableStreamSource(webStream),
            formats: ALL_FORMATS,
        });

        const audioTrack = await input.getPrimaryAudioTrack();
        const passThrough = new PassThrough({
            destroy(error, callback) {
                abortController?.abort();
                callback(error);
            },
        });

        if (!queue.metadata.filterManager) {
            queue.setMetadata({
                ...(queue.metadata),
                filterManager: new FilterManager(queue, discordPlayerConfig?.ffmpegFilters || {}),
            });
        }

        const sink = new AudioSampleSink(audioTrack);

        const initialFilters = [];

        try {
            initialFilters.push((queue.metadata.filterManager)._buildFilterChain());
        } catch {
            // no-op
        } finally {
            initialFilters.push(OUTPUT_FORMAT);
        }

        const init = initialFilters.join(",");

        let filterApi = NodeAV.FilterAPI.create(init);

        let currentFilterString = init;

        function changeFilter(filterString) {
            const filterStringFmt = !filterString ?
                OUTPUT_FORMAT :
                `${filterString},${OUTPUT_FORMAT}`;
            if (currentFilterString === filterStringFmt) return;
            const old = filterApi;
            currentFilterString = filterStringFmt;
            filterApi = NodeAV.FilterAPI.create(filterStringFmt);

            setTimeout(() => {
                old?.close();
            }, 200);
        };

        queue.setMetadata({
            ...queue.metadata,
            changeFilter,
        });

        let isNaturalFinish = true;

        function waitForDrainOrClose() {
            if (passThrough.destroyed || passThrough.writableEnded) return Promise.resolve();
            const isStale = () => {
                return passThrough.destroyed || passThrough.writableEnded || queueIndexTracker.get(queue) !== currentIndex;
            }

            return new Promise((resolve) => {
                const finish = () => {
                    clearInterval(poll);
                    passThrough.off("drain", finish);
                    passThrough.off("close", finish);
                    passThrough.off("error", finish);
                    resolve();
                };

                const poll = setInterval(() => {
                    if(isStale) {
                        isNaturalFinish = false;
                        finish();
                    }
                }, 250)

                passThrough.once("drain", finish);
                passThrough.once("close", finish);
                passThrough.once("error", finish);

                if (passThrough.destroyed || passThrough.writableEnded) finish();
            });
        }

        (async () => {
            let bufferCache = [];
            try {
                for await (const sample of sink.samples()) {
                    if (passThrough.destroyed) {
                        sample.close();
                        break;
                    }

                    const frame = new NodeAV.Frame();
                    frame.alloc();

                    try {
                        await toAvFrame(sample, frame);

                        for await (const processedFrame of filterApi.frames(frame)) {
                            const mSample = new AudioSample(new AvFrameAudioSampleResource(processedFrame));
                            let finalBuffer;
                            try {
                                const pcmBuffer = new Int16Array(mSample.numberOfFrames * mSample.numberOfChannels);
                                mSample.copyTo(pcmBuffer, {
                                    planeIndex: 0,
                                    format: "s16",
                                });
                                finalBuffer = Buffer.from(pcmBuffer.buffer, pcmBuffer.byteOffset, pcmBuffer.byteLength);
                            } finally {
                                mSample.close();
                            }

                            if (passThrough.destroyed) break;

                            bufferCache.push(finalBuffer);

                            if (bufferCache.length >= 3) {
                                const concatBuffer = Buffer.concat(bufferCache);
                                bufferCache = [];

                                const isWriteable = passThrough.write(
                                    concatBuffer,
                                );

                                if (!isWriteable) {
                                    await waitForDrainOrClose();
                                    if (passThrough.destroyed) break;
                                }
                            }
                        }
                    } catch (err) {
                        logger.error("[Mediabunny Filter Error]", err);
                        logger.error("Filter:", currentFilterString);
                        logger.error("Frame:", {
                            sampleRate: frame.sampleRate,
                            channels: frame.channels,
                            format: frame.format,
                            pts: frame.pts,
                        });
                    } finally {
                        frame?.unref();
                        sample.close();
                    }
                }
            } catch (error) {
                passThrough.destroy(error);
            } finally {
                if (bufferCache.length > 0)
                    passThrough.write(Buffer.concat(bufferCache));

                abortController?.abort();

                if (isNaturalFinish) {
                    passThrough.end();
                } else if (passThrough.destroyed) {
                    passThrough.destroy();
                }

                if(inputStream && !inputStream.destroyed) {
                    inputStream.destroy();
                }

                if(!input.disposed) {
                    input.dispose();
                }

                filterApi?.close();
            }
        })();

        return {
            stream: passThrough,
            $fmt: StreamType.Raw,
        };
    });

    return player;
}

/**
 * Registers all extractors
 * 
 * @param {Player} player 
 * @returns 
 */
async function registerExtractors(player) {
    const ffmpegFilters = discordPlayerConfig?.ffmpegFilters || {};
    for (const filter of Object.entries(ffmpegFilters)) AudioFilters.define(filter[0], filter[1]);

    onBeforeCreateStream(async (track, queryType, queue) => {
        try {
            if (track.extractor.identifier === DeezerExtractor.identifier ||
                track.extractor.identifier === SoundcloudExtractor.identifier ||
                track.extractor.identifier === YoutubeSabrExtractor.identifier ||
                track.extractor.identifier === SubsonicExtractor.identifier ||
                track.extractor.identifier === TTSExtractor.identifier ||
                track.extractor.identifier === AttachmentExtractor.identifier
            ) {
                const rawStream = await track.extractor?.stream(track);
                return rawStream;
            }
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
        try {
            const ytExt = await player.extractors.register(YoutubeExtractor, {
                ...getYoutubeExtractorOptions(extractors.Youtubei.config),
            });

            // const tempYtExt = await player.extractors.register(YoutubeiExtractor, {
            //    ...getYoutubeExtractorOptions(extractors.Youtubei.config),
            // });
            //
            // const secondYtExt = await player.extractors.register(YoutubeSabrExtractor, {
            //    ...getYoutubeExtractorOptions(extractors.Youtubei.config),
            //    logSabrEvents: extractors.Youtubei.config.logSabrEvents,
            // });
            // secondYtExt.priority = extractors.Youtubei.priority ? extractors.Youtubei.priority : secondYtExt.priority;
            //
            // const originalYtStreamMethod = tempYtExt.stream.bind(tempYtExt);
            //
            // await player.extractors.unregister(YoutubeiExtractor.identifier);
            //
            // let ytExt = null;
            // try {
            //    ytExt = await player.extractors.register(YoutubeiExtractor, {
            //        ...getYoutubeExtractorOptions(extractors.Youtubei.config),
            //        createStream: async (track, ext) => {
            //            if (extractors.Youtubei.config.useYTDL) {
            //                try {
            //                    return await originalYtStreamMethod(track, ext);
            //                } catch (e) {
            //                    if (extractors.Youtubei.config.useServerAbrStreamFallback) {
            //                        logger.warn("YTDL fallback failed, trying server ABR stream...");
            //                        return await createSabrStream(track.identifier, process.env.YOUTUBE_COOKIE, false);
            //                    }
            //                    throw e;
            //                }
            //            }
            //            return null;
            //        },
            //    });
            // } catch (e) {
            //    logger.error("Failed to register YoutubeiExtractor:", e);
            // }

            ytExt.priority = extractors.Youtubei.priority ? extractors.Youtubei.priority - 1 : ytExt.priority;
        } catch (e) {
            logger.error("Failed to register YoutubeiExtractor:", e);
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
        attachmentExt.protocols = ["file"];
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
    /** @type {import("discord-player-youtubei").YoutubeOptions} */
    const options = {};

    if (playerconfig?.useCookie) {
        const { cookiePath, cookieHeader } = youtubeCookieHandler.getYoutubeCookies();
        if (cookieHeader) options.cookie = cookieHeader;
        if (cookiePath) options.downloads = { ytdlp: { cookiePath } };
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

    options.anon = {
        maxPagingQueries: playerconfig?.maxPagingQueries ?? 100,
    };

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
    const finalObject = {};
    for (const kv of kvPair) {
        const [key, value] = kv.split("=");
        if (!validKeys.includes(key)) continue;
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