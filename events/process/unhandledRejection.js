module.exports = {
    name: "unhandledRejection",
    async execute(client, logger, err, promise) {
        if (err.includes("DiscordAPIError[50013]: Missing Permissions")) 
            return logger.warning("Missing permissions error occured, igoring stack.");
        logger.event("Unhandled Promise Rejection:");
        logger.severe(err);
    },
};