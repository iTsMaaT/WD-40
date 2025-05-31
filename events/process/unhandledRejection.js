module.exports = {
    name: "unhandledRejection",
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