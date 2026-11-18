const DB = require("../../utils/db/databaseManager.js");
module.exports = {
    name: "SIGINT",
    /**
     * Closes the database and exits after receiving SIGINT.
     * @param {import("discord.js").Client} client The Discord client.
     * @param {object} logger The application logger.
     * @param {*} err The signal event argument.
     */
    async execute(client, logger, err) {
        DB.close();
        process.exit(1);
    },
};