import { createRequire } from "module";
const require = createRequire(import.meta.url);
import { useQueue } from "discord-player";
import { toggleLiveChat } from "./playerLiveChat.js";
import { distubePluginToExtractor } from "./distubePluginToDiscordPlayerExtractor.js";
import { AttachmentExtractor } from "@discord-player/extractor";
import { YoutubeExtractor } from "discord-player-youtubei";
import { DeezerExtractor } from "discord-player-deezer";
const { SoundgasmExtractor } = require("discord-player-soundgasm");
import { TTSExtractor } from "discord-player-tts";
import { SoundcloudExtractor } from "discord-player-soundcloud";
import { SpotifyExtractor } from "discord-player-spotify";
import { AppleMusicExtractor } from "discord-player-applemusic";

const identifierMap = {
    "youtubei": YoutubeExtractor.identifier,
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
    const queue = useQueue(guild);
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

export {
    getLoopMode,
    getPauseMode,
    getFormattedSource,
    toggleLiveChat,
    useStats,
    searchWithPriorities,
    getProbableBridgeSource,
    distubePluginToExtractor,
};