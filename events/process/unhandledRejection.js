module.exports = {
    name: "unhandledRejection",
    async execute(client, logger, err, promise) {
        logger.severe("Unhandled Promise Rejection: " + err.stack);
    },
};