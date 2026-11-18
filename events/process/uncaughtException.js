module.exports = {
    name: "uncaughtException",
    /**
     * Logs an uncaught exception.
     * @param {import("discord.js").Client} client The Discord client.
     * @param {object} logger The application logger.
     * @param {Error} err The uncaught exception.
     */
    async execute(client, logger, err) {
        logger.event("Uncaught Exception:");
        logger.severe(err);
    },
};