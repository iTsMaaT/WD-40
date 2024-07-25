module.exports = {
    name: "error",
    once: false,
    async execute(client, logger, queue, error) {
        logger.info(`Queue: ${queue.metadata.guild.name} threw error: \n ${error}`);
    },
};