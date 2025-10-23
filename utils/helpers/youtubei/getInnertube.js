const { Innertube, UniversalCache, Platform } = require("youtubei.js");

let ineerTubeInstance = null;

Platform.shim.eval = async (data, env) => {
    const properties = [];

    if (env.n) 
        properties.push(`n: exportedVars.nFunction("${env.n}")`);
  

    if (env.sig) 
        properties.push(`sig: exportedVars.sigFunction("${env.sig}")`);
  

    const code = `${data.output}\nreturn { ${properties.join(", ")} }`;

    return new Function(code)();
};

/**
 * Get the Innertube instance
 * @returns {Promise<Innertube>} The Innertube instance
 */
async function getInnertube(cookies) {
    if (!ineerTubeInstance) {
        ineerTubeInstance = await Innertube.create({
            cache: new UniversalCache(false),
            // player_id: "0004de42",
            cookie: cookies,
        });
    }
    return ineerTubeInstance; 
}

module.exports = { getInnertube };