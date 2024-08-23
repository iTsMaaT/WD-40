const changelog = require("@root/changelogs.json");
const logger = require("@utils/log");
const { version } = require("@root/package.json");

/**
 * Check if the bot version is up to date between the changelog and package.json
 * @returns {void}
 */
const checkBotVersion = function() {
    const changelogLatestVersion = changelog[changelog.length - 1].version.split(".");
    const packageJSONVersion = version.split(".");
    let mismatch = false;

    if (changelogLatestVersion[2] != packageJSONVersion[2]) {
        logger.warning("Patch version mismatch");
        mismatch = true;
    }

    if (changelogLatestVersion[1] != packageJSONVersion[1]) {
        logger.warning("Minor version mismatch");
        mismatch = true;
    }
    
    if (changelogLatestVersion[0] != packageJSONVersion[0]) {
        logger.warning("Major version mismatch");
        mismatch = true;
    }

    if (mismatch) {
        logger.warning("Changelog version: " + changelogLatestVersion.join("."));
        logger.warning("Package.json version: " + packageJSONVersion.join("."));
        logger.warning("Please update the bot version so they both match");
        logger.warning("Exiting...");
        process.exit(1);
    }

    logger.info("Bot version is up to date");
};

module.exports = { execute: checkBotVersion };