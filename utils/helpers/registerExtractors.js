const { Player, AudioFilters } = require("discord-player");
const config = require("@utils/config/configUtils");
const discordPlayerConfig = config.get("discordPlayerConf");
const exts = require("@discord-player/extractor");
const { YoutubeiExtractor } = require("discord-player-youtubei");
const { DeezerExtractor, NodeDecryptor, JSDecryptor } = require("discord-player-deezer");
const { SoundgasmExtractor } = require("soundgasm-extractor");
const { TTSExtractor } = require("tts-extractor");
// const { SoundCloudExtractor } = require("discord-player-soundcloud");
const SoundCloudExtractor = require("@utils/helpers/SoundCloudExtractor");
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

        const ytExtOptions = { streamOptions: {} };
        if (!discordPlayerConfig?.skipLogin) ytExtOptions.authentication = process.env.YOUTUBE_ACCESS_STRING;
        if (discordPlayerConfig?.useCookie) ytExtOptions.cookie = process.env.YOUTUBE_COOKIE;
        ytExtOptions.streamOptions.useClient = discordPlayerConfig?.youtubeClient || "IOS";
        if (discordPlayerConfig?.usePoToken) {
            ytExtOptions.streamOptions.useClient = "WEB";
            ytExtOptions.generateWithPoToken = true;
        }

        ytExtOptions.streamOptions.highWaterMark = discordPlayerConfig?.highWaterMark || 1024 * 1024;

        const ytExt = await player.extractors.register(YoutubeiExtractor, {
            ...ytExtOptions,
        });

        ytExt.priority = getPriority("youtube") ?? ytExt.priority;

        // if (discordPlayerConfig?.usePoToken) {
        //    const innertube = ytExt.innerTube;
        //    const potoken = await poTokenExtraction(innertube);
        //    const visitorData = innertube.session.context.client.visitorData;
        //    ytExt.setPoToken(potoken, visitorData);
        //
        //    setInterval(async () => {
        //        const innertube = ytExt.innerTube;
        //        const potoken = await poTokenExtraction(innertube);
        //        const visitorData = innertube.session.context.client.visitorData;
        //        ytExt.setPoToken(potoken, visitorData);
        //    }, 6.048e+8).unref();
        // }
    }

    if (!discordPlayerConfig?.removeDeezer) {
        const deezerExt = await player.extractors.register(DeezerExtractor, {
            decryptionKey: process.env.DEEZER_MASTER_KEY,
            arl: process.env.DEEZER_ARL_COOKIE,
            decryptor: NodeDecryptor,
        });

        deezerExt.priority = getPriority("deezer") ?? deezerExt.priority;
    }

    logger.info("Loading SoundCloudExtractor extractor...");
    await player.extractors.register(SoundCloudExtractor, {
        clientId: process.env.SOUNDCLOUD_CLIENT_ID,
        oauthToken: process.env.SOUNDCLOUD_OAUTH_TOKEN,
    });

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

module.exports = { initPlayer, registerExtractors, reload };