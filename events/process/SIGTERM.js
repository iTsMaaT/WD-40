module.exports = {
    name: "SIGTERM",
    async execute(client, logger, err) {
        logger.event("SIGTERM signal caught:");
        logger.severe(err);
        process.exit(1);
    },
};