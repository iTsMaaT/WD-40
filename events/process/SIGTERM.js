const DB = require("../../utils/db/databaseManager.js");
module.exports = {
    name: "SIGTERM",
    /**
     * Logs SIGTERM, closes the database, and exits the process.
     * @param {import("discord.js").Client} client The Discord client.
     * @param {object} logger The application logger.
     * @param {*} err The signal event argument.
     */
    async execute(client, logger, err) {
        logger.event("SIGTERM signal caught:");
        logger.severe(err);
        DB.close();
        process.exit(1);
    },
};