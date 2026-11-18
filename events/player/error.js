module.exports = {
    name: "error",
    once: false,
    /**
     * Logs an error emitted by the audio player.
     * @param {import("discord.js").Client} client The Discord client.
     * @param {object} logger The application logger.
     * @param {Error} error The player error.
     */
    async execute(client, logger, error) {
        logger.info("Player error:");
        logger.error(error);
    },
};