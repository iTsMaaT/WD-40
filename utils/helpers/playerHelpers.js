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

module.exports = {
    getLoopMode,
};