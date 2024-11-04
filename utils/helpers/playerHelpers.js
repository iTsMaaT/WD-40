const { createHook } = require("discord-player");
const { toggleLiveChat } = require("./playerLiveChat");

/**
 * Get the loop mode of the queue.
 * 
 * @param {Queue} queue - The queue to get the loop mode from.
 * @returns {string} The loop mode of the queue.
 */
const getLoopMode = function(queue) {
    let LoopMode;
    switch (queue?.repeatMode) {
        case 0:
            LoopMode = "❌ Off";
            break;
        case 1:
            LoopMode = "✅ Track";
            break;
        case 2:
            LoopMode = "✅ Queue";
            break;
        case 3:
            LoopMode = "✅ Autoplay";
            break;
        default:
            LoopMode = "❌ Off";
            break;
    }
    return LoopMode;
};

/**
 * Get the pause mode of the queue.
 * 
 * @param {Queue} queue - The queue to get the pause mode from.
 * @returns {string} The pause mode of the queue.
 */
const getPauseMode = function(queue) {
    let PauseMode;
    switch (queue?.paused) {
        case true:
            PauseMode = "✅ Paused";
            break;
        case false:
            PauseMode = "❌ Unpaused";
            break;
        default:
            PauseMode = "❌ Unpaused";
            break;
    }
    return PauseMode;
};

/**
 * Get the formatted source string of the queue.
 * 
 * @param {Queue} queue - The queue to get the source from.
 * @returns {string} The source of the queue.
 */
const getFormattedSource = function(queue) {
    let source;
    switch (queue?.source) {
        case "youtube":
            source = "YouTube";
            break;
        case "soundcloud":
            source = "SoundCloud";
            break;
        case "deezer":
            source = "Deezer";
            break;
        case "spotify":
            source = "Spotify";
            break;
        case "applemusic":
            source = "Apple Music";
            break;
        case "tidal":
            source = "Tidal";
            break;
        default:
            source = "N/A";
            break;
    }
    return source;
};

/**
 * Get the stats of the queue.
 * 
 * @param {Queue} queue - The queue to get the stats from.
 * @returns {object} The stats of the queue.
 */
const useStats = createHook((context) => {
    return (node) => {
        const queue = context.getQueue(node);
        if (!queue) return null;

        return queue.stats.generate();
    };
});

module.exports = {
    getLoopMode,
    getPauseMode,
    getFormattedSource,
    toggleLiveChat,
    useStats,
};