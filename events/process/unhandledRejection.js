module.exports = {
    name: "unhandledRejection",
    async execute(client, logger, err, promise) {
        logger.event("Unhandled Promise Rejection:");
        logger.severe(err);
    },
};