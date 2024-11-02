module.exports = {
    name: "uncaughtException",
    async execute(client, logger, err) {
        logger.event("Uncaught Exception:");
        logger.severe(err);
    },
};