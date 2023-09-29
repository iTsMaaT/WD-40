module.exports = {
    name: "uncaughtException",
    async execute(client, logger, err) {
        logger.severe("Uncaught Exception: " + err.stack);
    },
};