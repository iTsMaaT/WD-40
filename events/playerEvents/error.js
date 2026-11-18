export default {
    name: "error",
    once: false,
    /**
     * Logs an error emitted while processing a music queue.
     * @param {import("discord.js").Client} client The Discord client.
     * @param {object} logger The application logger.
     * @param {*} queue The queue where the error occurred.
     * @param {Error} error The queue error.
     */
    async execute(client, logger, queue, error) {
        logger.info(`Queue: ${queue.metadata.guild.name} threw error: \n ${error}`);
    },
};