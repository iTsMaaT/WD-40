const { toggleLiveChat } = require("./playerLiveChat");

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

module.exports = {
    getLoopMode,
    getPauseMode,
    getFormattedSource,
    toggleLiveChat,
};