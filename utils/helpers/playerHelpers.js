const { useQueue } = require("discord-player");
const { toggleLiveChat } = require("./playerLiveChat");
const { distubePluginToExtractor } = require("./distubePluginToDiscordPlayerExtractor");
const { AttachmentExtractor } = require("@discord-player/extractor");
const { YoutubeiExtractor } = require("discord-player-youtubei");
const { YoutubeSabrExtractor } = require("@utils/helpers/youtubei/youtubeiExtractor");
const { DeezerExtractor } = require("discord-player-deezer");
const { SoundgasmExtractor } = require("discord-player-soundgasm");
const { TTSExtractor } = require("discord-player-tts");
const { SoundcloudExtractor } = require("discord-player-soundcloud");
const { SpotifyExtractor } = require("discord-player-spotify");
const { AppleMusicExtractor } = require("discord-player-applemusic");
const config = require("@utils/config/configUtils");

const identifierMap = {
    "youtubei": config.get("discordPlayer").extractors.Youtubei.config.useSabrAlternative ? YoutubeSabrExtractor.identifier : YoutubeiExtractor.identifier,
    "deezer": DeezerExtractor.identifier,
    "soundcloud": SoundcloudExtractor.identifier,
    "spotify": SpotifyExtractor.identifier,
    "applemusic": AppleMusicExtractor.identifier,
    "tts": TTSExtractor.identifier,
    "attachment": AttachmentExtractor.identifier,
    "Soundgasm": SoundgasmExtractor.identifier,
};

/**
 * Get the loop mode of the queue.
 * 
 * @param {Queue} queue - The queue to get the loop mode from.
 * @returns {string} The loop mode of the queue.
 */
const getLoopMode = (queue) => {
    const modes = ["❌ Off", "✅ Track", "✅ Queue", "✅ Autoplay"];
    return modes[queue?.repeatMode] || "❌ Off";
};

/**
 * Get the pause mode of the queue.
 * 
 * @param {Queue} queue - The queue to get the pause mode from.
 * @returns {string} The pause mode of the queue.
 */
const getPauseMode = (queue) => queue?.paused ? "✅ Paused" : "❌ Unpaused";

/**
 * Get the formatted source string of the queue.
 * 
 * @param {Queue} queue - The queue to get the source from.
 * @returns {string} The source of the queue.
 */
const getFormattedSource = (queue) => {
    const sourceMap = {
        youtube: "YouTube",
        soundcloud: "SoundCloud",
        deezer: "Deezer",
        spotify: "Spotify",
        applemusic: "Apple Music",
        tidal: "Tidal",
    };
    return sourceMap[queue?.source] || "N/A";
};

/**
 * Get the stats of the queue.
 * 
 * @param {Queue} queue - The queue to get the stats from.
 * @returns {object} The stats of the queue.
 */
const useStats = (guild) => {
    const queue = useQueue(guild.id);
    if (!queue) return null;
    return queue.stats.generate();
};

/**
 * Search for a valid extractor based on the stream priorities.
 * 
 * @param {PlayerConfig} playerConfig - The player configuration.
 * @returns {Extractor} The extractor to use.
 */
const searchWithPriorities = function(playerConfig) {
    const extractorsArray = Object.entries(playerConfig.extractors);

    const streamableAndBridgeableExtractors = extractorsArray.filter(extractor => {
        return extractor[1].canStream && extractor[1].canBridge && extractor[1].enabled;
    }).sort((a, b) => {
        return  b[1].priority - a[1].priority;
    });

    return identifierMap[streamableAndBridgeableExtractors[0][0].toLowerCase()] || null; 
};

/**
 * Get the probable bridge source based on the player configuration.
 * 
 * @param {PlayerConfig} playerConfig - The player configuration.
 * @param {boolean} providesStream - Whether the source provides a stream.
 * @returns {string} The probable bridge source.
 */
const getProbableBridgeSource = function(playerConfig, providesStream) {
    if (providesStream) return "Itself";
    const extractorsArray = Object.entries(playerConfig.extractors);
    const streamableAndBridgeableExtractors = extractorsArray.filter(extractor => {
        return extractor[1].canStream && extractor[1].canBridge && extractor[1].enabled;
    }).sort((a, b) => {
        return  b[1].priority - a[1].priority;
    });

    const streamProviders = streamableAndBridgeableExtractors.map(extractor => extractor[0]);

    return streamProviders.length > 0 ? streamProviders.join(" \\▶ ") : "N/A";
};

const getAllPlayerStatsSharded = async (client) => {
    const stats = await client.shard.broadcastEval(() => {
        // eslint-disable-next-line no-shadow
        const { useQueue } = require("discord-player");
        return this.guilds.cache.map(guild => {
            const queue = useQueue(guild.id);
            if (!queue) return null;
            return queue.stats.generate();
        });
    });

    const queueSize = stats.length;
    const flatStats = stats.flat().filter(Boolean);

    return {
        tracksCount: flatStats.reduce((acc, stat) => acc + stat.tracksCount, 0),
        historySize: flatStats.reduce((acc, stat) => acc + stat.historySize, 0),
        queueSize,
        extractors: flatStats.reduce((acc, stat) => acc + stat.extractors, 0),
        listeners: flatStats.reduce((acc, stat) => acc + stat.listeners, 0),
    };
};

module.exports = {
    getAllPlayerStatsSharded,
    getLoopMode,
    getPauseMode,
    getFormattedSource,
    toggleLiveChat,
    useStats,
    searchWithPriorities,
    getProbableBridgeSource,
    distubePluginToExtractor,
};