module.exports = {
    name: "unhandledRejection",
    /**
     * Logs an unhandled promise rejection, suppressing known Discord API errors.
     * @param {import("discord.js").Client} client The Discord client.
     * @param {object} logger The application logger.
     * @param {*} err The rejection reason.
     * @param {Promise<*>} promise The promise that was rejected.
     */
    async execute(client, logger, err, promise) {
        if (err.code == 50013) 
            return logger.warning("Missing access error occured, igoring stack.");
        else if (err.code == 50035)
            return logger.warning("Invalid form body error occured, igoring stack.");
        logger.event("Unhandled Promise Rejection:");
        logger.severe(err);
        // logger.severe("Promise:", promise);
    },
};