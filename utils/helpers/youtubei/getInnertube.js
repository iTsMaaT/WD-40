const { Innertube, UniversalCache } = require("youtubei.js");

let ineerTubeInstance = null;

/**
 * Get the Innertube instance
 * @returns {Promise<Innertube>} The Innertube instance
 */
async function getInnertube() {
    if (!ineerTubeInstance) {
        ineerTubeInstance = await Innertube.create({
            cache: new UniversalCache(false),
            player_id: "0004de42",
            cookie: process.env.YOUTUBE_COOKIE,
        });
    }
    return ineerTubeInstance; 
}

module.exports = { getInnertube };