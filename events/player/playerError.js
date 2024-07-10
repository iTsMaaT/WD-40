module.exports = {
    name: "playerError",
    once: false,
    execute(client, logger, queue, error) {
        logger.info(`Queue: ${queue.metadata.guild.name} threw error: \n ${error}`);
    },
};