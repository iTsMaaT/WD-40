const fs = require("fs");
const path = require("path");
const logger = require("@utils/log");

/**
 * Handles YouTube cookies by reading from environment variables,
 * writing them to a file, and returning the file path
 * @returns {string|null} Path to the cookies file or null if no cookies found
 */
function youtubeCookieHandler() {
    try {
        const b64 = process.env.YOUTUBE_NETSCAPE_COOKIES_B64;
        if (!b64) {
            logger.warning("[YouTube Cookie Handler] No YOUTUBE_NETSCAPE_COOKIES_B64 found in environment variables");
            return null;
        }

        const cookies = Buffer.from(b64, "base64").toString("utf8");

        if (!cookies) {
            logger.warning("[YouTube Cookie Handler] Decoded cookies string is empty");
            return null;
        }

        const cookiePath = path.join(__dirname, "cookies.txt");

        // Write cookies to file
        fs.writeFileSync(cookiePath, cookies, "utf8");
        logger.info("[YouTube Cookie Handler] Cookies written to file successfully");

        return cookiePath;
    } catch (error) {
        logger.error("[YouTube Cookie Handler] Error handling cookies:", error);
        return null;
    }
}

/**
 * Converts Netscape-format cookie file contents into a "name=value; ..." Cookie header string,
 * which is the format expected by Innertube/youtubei.js (as opposed to yt-dlp, which wants a file path)
 *
 * @param {string} netscapeContent
 * @returns {string|null}
 */
function netscapeCookiesToHeader(netscapeContent) {
    const pairs = netscapeContent
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line && !line.startsWith("#"))
        .map((line) => {
            const fields = line.split("\t");
            if (fields.length < 7) return null;
            const [, , , , , name, value] = fields;
            return `${name}=${value}`;
        })
        .filter(Boolean);

    return pairs.length ? pairs.join("; ") : null;
}

/**
 * Gets the YouTube cookie as a Cookie header string (for Innertube), writing the cookies
 * file as a side effect so the Netscape path is also available for yt-dlp
 *
 * @returns {{ cookiePath: string|null, cookieHeader: string|null }}
 */
function getYoutubeCookies() {
    const cookiePath = youtubeCookieHandler();
    if (!cookiePath) return { cookiePath: null, cookieHeader: null };

    try {
        const cookieHeader = netscapeCookiesToHeader(fs.readFileSync(cookiePath, "utf8"));
        return { cookiePath, cookieHeader };
    } catch (error) {
        logger.error("[YouTube Cookie Handler] Error parsing cookies for header:", error);
        return { cookiePath, cookieHeader: null };
    }
}

module.exports = youtubeCookieHandler;
module.exports.getYoutubeCookies = getYoutubeCookies;