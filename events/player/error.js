module.exports = {
    name: "error",
    once: false,
    execute(client, logger, queue, error) {
        logger.info(`Queue: ${queue} threw error: \n ${error}`);
    },
};