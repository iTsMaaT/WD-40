export default {
    name: "shutdown",
    /**
     * Exits the bot process.
     * @param {import("discord.js").Client} client The Discord client.
     * @param {object} logger The application logger.
     */
    execute(client, logger) {
        console.log("Shutting down");
        process.exit();
    },
};