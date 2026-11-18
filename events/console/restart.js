module.exports = {
    name: "restart",
    /**
     * Exits the process with a failure code to trigger a bot restart.
     * @param {import("discord.js").Client} client The Discord client.
     * @param {object} logger The application logger.
     */
    execute(client, logger) {
        console.log("Restarting");
        process.exit(1);
    },
};