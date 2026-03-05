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

module.exports = youtubeCookieHandler;