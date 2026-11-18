const logger = require("@utils/log");
const config = require("@utils/config/configUtils");
const { ensureLocalAIModel } = require("@utils/helpers/ensureLocalAIModel");

/**
 * Start downloading the local AI model in the background if it is missing.
 * This doesn't block startup: the first local AI request waits for the same download.
 * @returns {void}
 */
const checkLocalAIModel = function() {
    if (config.get("aiModelProvider") !== "local") return;

    ensureLocalAIModel()
        .then((modelPath) => logger.info(`Local AI model ready: ${modelPath}`))
        .catch((error) => {
            logger.warning(`Local AI model is unavailable: ${error.message}`);
            logger.warning("Local AI commands will retry the download when used.");
        });
};

module.exports = { execute: checkLocalAIModel };
