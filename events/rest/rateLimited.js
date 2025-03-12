module.exports = {
    name: "rateLimited",
    once: false,
    async execute(client, logger, rateLimitData) {
        // https://discord.js.org/docs/packages/discord.js/14.18.0/RateLimitData:Interface
        logger.warning("Rate limited:");
        logger.info(rateLimitData);
    },
};