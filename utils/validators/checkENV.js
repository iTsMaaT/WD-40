const logger = require("@utils/log");

/**
 * Validate the environment variables
 * @returns {void}
 */
const validateEnvironmentVariables = function() {
    logger.debug("Validating environment variables...");
    const requiredEnvironmentVariables = [
        "TOKEN",
        "SERVER",
        "CLIENT_ID",
        "OWNER_ID",
        "SERVER",
    ];

    const missingEnvironmentVariables = [];
    for (const requiredEnvironmentVariable of requiredEnvironmentVariables) {
        if (!process.env[requiredEnvironmentVariable] || process.env[requiredEnvironmentVariable].length === 0) 
            missingEnvironmentVariables.push(requiredEnvironmentVariable);
    }

    if (missingEnvironmentVariables.length > 0) {
        const errorMessage = `Missing the following required environment variables: ${missingEnvironmentVariables.join(", ")}. Exiting...`;
        logger.error(errorMessage);
        process.exit(1);
    }

    for (const requiredEnvironmentVariable of requiredEnvironmentVariables)
        logger.debug(`${requiredEnvironmentVariable} is set.`);

    // Check that SERVER is set to development or production
    if (process.env.SERVER !== "dev" && process.env.SERVER !== "prod") {
        logger.error("SERVER is not set to dev or prod. Please set it to either of these values. Exiting...");
        process.exit(0);
    }

    logger.debug(`SERVER is set to ${process.env.SERVER}.`);

    logger.info("Successfully validated environment variables.");
};

module.exports = { execute: validateEnvironmentVariables };