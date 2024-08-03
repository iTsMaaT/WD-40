const logger = require("@utils/log");

const validateEnvironmentVariables = async function() {
    logger.debug("Validating environment variables...");
    const requiredEnvironmentVariables = [
        "TOKEN",
        "CLIENT_ID",
        "GEMINI_API_PROXY_URL",
        "GEMINI_API_KEY",
        "PTERODACTYL_API_KEY",
        "PTERODACTYL_URL",
        "PTERODACTYL_SERVER_ID",
        "VIRUS_TOTAL_API_KEY",
        "STEAM_API_KEY",
        "REDDIT_CLIENT_SECRET",
        "REDDIT_CLIENT_ID",
        "REDDIT_REFRESH_TOKEN",
        "YOUTUBE_ACCESS_STRING",
        "DATABASE_URL",
        "OWNER_ID",
        "STATUS_CHANNEL_ID",
        "MEMBERS_UPDATE_ID",
        "SUGGESTION_CHANNEL_ID",
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
        process.exit(1);
    }

    logger.debug(`SERVER is set to ${process.env.SERVER}.`);

    logger.info("Successfully validated environment variables.");
};

module.exports = { validateEnvironmentVariables };