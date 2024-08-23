const { exec } = require("child_process");
const logger = require("@utils/log");

/**
 * Check if Node.js is up to date on the system
 * @returns {void}
 */
const checkNodeJsVersion = async function() {
    await new Promise((resolve, reject) => {
        exec("node -v", (error, stdout) => {
            if (error) {
                logger.error("An error occurred while checking Node.js version. Exiting...");
                reject(error);
                process.exit(1);
            } else {
                const nodeVersionString = stdout.trim();
                const nodeVersionArray = nodeVersionString
                    .split(".")
                    .map((n) => Number.parseInt(n.replace("v", "")));
                logger.debug(`Detected Node.js version: ${nodeVersionString}`);

                let nodeMajorVersion = nodeVersionArray[0];
                if (typeof nodeMajorVersion !== "number" || Number.isNaN(nodeMajorVersion)) 
                    nodeMajorVersion = 0;
                
                const LATEST_SUPPORTED_VERSION = 20;
                if (nodeMajorVersion < LATEST_SUPPORTED_VERSION) {
                    logger.warning(
                        `Node.js version is below supported version ${LATEST_SUPPORTED_VERSION}. Please consider upgrading to LTS version.`,
                    );
                }
            }
            resolve();
        });
    });
};

module.exports = { execute: checkNodeJsVersion };