const { Readable, PassThrough, once } = require("stream");
const https = require("https");
const http = require("http");

/**
 * Converts a web stream to a Node.js Readable stream
 * 
 * @param {ReadableStream} stream - The web stream to convert
 * @returns {Readable} The Node.js Readable stream
 */
function toNodeReadable(stream) {
    const nodeStream = new PassThrough();
    const reader = stream.getReader();

    (async () => {
        try {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                if (value) {
                    if (!nodeStream.write(Buffer.from(value))) 
                        await once(nodeStream, "drain");
                }
            }
        } finally {
            nodeStream.end();
        }
    })();

    return nodeStream;
}

/**
 * Makes an HTTP request and returns a Promise
 * 
 * @param {string} url - The URL to request
 * @param {Object} options - Request options
 * @returns {Promise<string>} The response body
 */
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith("https") ? https : http;
        const requestOptions = {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                ...options.headers,
            },
            ...options,
        };

        const req = protocol.get(url, requestOptions, (res) => {
            let data = "";
            res.on("data", (chunk) => {
                data += chunk;
            });
            res.on("end", () => {
                resolve(data);
            });
        });

        req.on("error", reject);
        req.setTimeout(30000, () => {
            req.destroy();
            reject(new Error("Request timeout"));
        });
    });
}

/**
 * Parses an M3U8 playlist and extracts media segments
 * 
 * @param {string} m3u8Content - The M3U8 content
 * @param {string} baseUrl - The base URL for relative links
 * @returns {Array<Object>} Array of segment objects with duration and URL
 */
function parseM3U8(m3u8Content, baseUrl) {
    const lines = m3u8Content.split("\n");
    const segments = [];
    let currentDuration = 0;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (line.startsWith("#EXTINF:")) {
            const durationMatch = line.match(/#EXTINF:([\d.]+)/);
            if (durationMatch) 
                currentDuration = parseFloat(durationMatch[1]);
            
        } else if (line && !line.startsWith("#")) {
            const segmentUrl = line.startsWith("http") 
                ? line 
                : new URL(line, baseUrl).href;

            segments.push({
                url: segmentUrl,
                duration: currentDuration,
            });
            currentDuration = 0;
        }
    }

    return segments;
}

/**
 * Extracts the HLS/DASH manifest URL from player response
 * 
 * @param {Object} playerResponse - The player response object
 * @returns {string|null} The HLS manifest URL or null if not found
 */
function extractManifestUrl(playerResponse) {
    // Try HLS manifest first (most common for livestreams)
    if (playerResponse.streaming_data?.hls_manifest_url) 
        return playerResponse.streaming_data.hls_manifest_url;
    

    // Try DASH manifest
    if (playerResponse.streaming_data?.dash_manifest_url) 
        return playerResponse.streaming_data.dash_manifest_url;
    

    // Fallback: Check formats for manifest URLs
    const formats = playerResponse.streaming_data?.formats || [];
    for (const format of formats) {
        if (format.url && (format.url.includes("manifest") || format.url.includes(".m3u8"))) 
            return format.url;
        
    }

    return null;
}

module.exports = {
    toNodeReadable,
    makeRequest,
    parseM3U8,
    extractManifestUrl,
};
