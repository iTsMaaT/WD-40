const config = require("@utils/config/configUtils");

module.exports = {
    name: "rateLimited",
    once: false,
    /**
     * Logs REST rate-limit data when rate-limit logging is enabled.
     * @param {import("discord.js").Client} client The Discord client.
     * @param {object} logger The application logger.
     * @param {import("discord.js").RateLimitData} rateLimitData Details of the rate limit.
     */
    async execute(client, logger, rateLimitData) {
        // https://discord.js.org/docs/packages/discord.js/14.18.0/RateLimitData:Interface
        if (!config.get("logRateLimited")) return;
        logger.warning("Rate limited:");
        logger.info(rateLimitData);
    },
};