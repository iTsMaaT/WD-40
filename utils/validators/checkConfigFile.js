const logger = require("@utils/log");
const config = require("@utils/config/configUtils");

/**
 * Check if config file exists and is valid
 * @returns {void}
 */
const checkConfigFile = function() {
    try {
        // Config is already loaded and parsed by configUtils
        const baseConfig = config.getAllBaseConfig();
        
        // Validate required fields
        const requiredFields = ["defaultPrefix", "activities"];
        const missingFields = [];
        
        for (const field of requiredFields) {
            if (!(field in baseConfig)) 
                missingFields.push(field);
        }

        if (missingFields.length > 0) {
            logger.warning("The following required config fields are missing: " + missingFields.join(", "));
            logger.warning("Some bot features may not work as expected.");
        }

        // Validate activities array structure
        if (Array.isArray(baseConfig.activities)) {
            for (let i = 0; i < baseConfig.activities.length; i++) {
                const activity = baseConfig.activities[i];
                if (typeof activity !== "object" || !("type" in activity) || !("name" in activity)) 
                    logger.warning(`Activity at index ${i} is missing 'type' or 'name' field`);
            }
            logger.debug(`Found ${baseConfig.activities.length} activities configured.`);
        } else {
            logger.warning("'activities' field should be an array");
        }

        logger.info("Config file validation successful.");
    } catch (error) {
        logger.error("Failed to validate config file: " + error.message);
        logger.error("Exiting...");
        process.exit(0);
    }
};

module.exports = { execute: checkConfigFile };
