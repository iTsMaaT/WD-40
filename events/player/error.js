module.exports = {
    name: "error",
    once: false,
    async execute(client, logger, error) {
        logger.info("Player error:");
        logger.error(error);
    },
};