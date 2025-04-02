const { Player, AudioFilters } = require("discord-player");
const config = require("@utils/config/configUtils");
const discordPlayerConfig = config.get("discordPlayerConf");
const exts = require("@discord-player/extractor");
const { YoutubeiExtractor, stream } = require("discord-player-youtubei");
const { DeezerExtractor, NodeDecryptor, JSDecryptor } = require("discord-player-deezer");
const { SoundgasmExtractor } = require("soundgasm-extractor");
const { TTSExtractor } = require("tts-extractor");
const { SoundcloudExtractor } = require("discord-player-soundcloud");
const { SpotifyExtractor } = require("discord-player-spotify");
// const { AppleMusicExtractor } = require("discord-player-applemusic");
// const SoundCloudExtractor = require("@utils/helpers/SoundCloudExtractor");
const logger = require("@utils/log");

const { Log } = require("youtubei.js");
Log.setLevel(Log.Level.NONE);

async function initPlayer(client) {
    return new Player(client, {
        skipFFmpeg: discordPlayerConfig?.skipFFmpeg,
    });
}

async function registerExtractors(player) {
    logger.info("Loading TTSExtractor extractor...");
    await player.extractors.register(TTSExtractor, {
        language: "fr",
        slow: true,
    });

    const ffmpegFilters = config.get("discordPlayerConf")?.ffmpegFilters || {};
    for (const filter of Object.entries(ffmpegFilters)) AudioFilters.define(filter[0], filter[1]);

    /**
     * Get the priority of a stream provider
     *
     * @param {string} streamProvider The stream provider
     * @returns {number} The priority
     */
    const getPriority = (streamProvider) => {
        const index = discordPlayerConfig?.streamPriorities?.indexOf(streamProvider);
        return index !== -1 ? 10 + discordPlayerConfig?.streamPriorities.length - index : null;
    };

    logger.info("Loading SoundgasmExtractor extractor...");
    await player.extractors.register(SoundgasmExtractor, {
        skipProbing: true,
        attemptAlternateProbing: true,
    });

    if (!discordPlayerConfig?.removeYoutube) {
        logger.info("Loading YoutubeiExtractor extractor...");
        
        const ytExtOptions = getYoutubeExtractorOptions(discordPlayerConfig);
        const ytExt = await player.extractors.register(YoutubeiExtractor, ytExtOptions);
        ytExt.priority = getPriority("youtube") ?? ytExt.priority;
    }

    if (!discordPlayerConfig?.removeDeezer) {
        const deezerExt = await player.extractors.register(DeezerExtractor, {
            decryptionKey: process.env.DEEZER_MASTER_KEY,
            arl: process.env.DEEZER_ARL_COOKIE,
            decryptor: NodeDecryptor,
            reloadUserInterval: 9 * 60 * 60 * 1000,
        });

        deezerExt.priority = getPriority("deezer") ?? deezerExt.priority;
    }

    logger.info("Loading SoundCloudExtractor extractor...");
    await player.extractors.register(SoundcloudExtractor, {});

    logger.info("Loading SpotifyExtractor extractor...");
    await player.extractors.register(SpotifyExtractor, {
        clientId: process.env.SPOTIFY_CLIENT_ID,
        clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
    });

    // logger.info("Loading AppleMusicExtractor extractor...");
    // await player.extractors.register(AppleMusicExtractor, {});

    for (const ext of Object.entries(discordPlayerConfig.extractors)) {
        if (ext[1].enabled) {
            logger.info(`Loading ${ext[0]} extractor...`);
            const currentExt = await player.extractors.register(exts[ext[0]], ext[1].options);
            for (const streamProvider of discordPlayerConfig.streamPriorities) if (ext[0].toLowerCase().includes(streamProvider.toLowerCase())) currentExt.priority = getPriority(streamProvider) || currentExt.priority;
        }
    }
}

async function reload(player) {
    await player.extractors.unregisterAll();
    await registerExtractors(player);
}

function getYoutubeExtractorOptions(playerconfig) {
    const options = {
        streamOptions: {
            useClient: playerconfig?.youtubeClient || "IOS",
            highWaterMark: playerconfig?.highWaterMark || 1024 * 1024,
        },
    };

    if (!playerconfig?.skipLogin) 
        options.authentication = process.env.YOUTUBE_ACCESS_STRING;

    if (playerconfig?.useCookie) 
        options.cookie = process.env.YOUTUBE_COOKIE;
    
    if (playerconfig?.useServerAbrStream) {
        options.useServerAbrStream = true;
        if (!playerconfig?.usePoToken) playerconfig.usePoToken = true;
    }

    if (playerconfig?.usePoToken) {
        options.streamOptions.useClient = "WEB";
        options.generateWithPoToken = true;
    }

    return options;
}

module.exports = { initPlayer, registerExtractors, reload };