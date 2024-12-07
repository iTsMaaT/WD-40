const config = require("@utils/config/configUtils");
const logger = require("@utils/log");

/**
 * Check if the OpenSSL Legacy Provider is enabled
 * @returns {void}
 */
const checkDeezerLegacyOpenSSL = async function() {
    if (config.get("discordPlayerConf")?.removeDeezer) return;
    logger.debug("Checking if the OpenSSL Legacy Provider is enabled...");
    if (!process.execArgv.includes("--openssl-legacy-provider")) {
        logger.error("The OpenSSL Legacy Provider flag (--openssl-legacy-provider) is not set but the Deezer extractor is enabled.");
        process.exit(0);
    }
    logger.debug("The OpenSSL Legacy Provider is enabled.");
};

module.exports = { execute: checkDeezerLegacyOpenSSL };