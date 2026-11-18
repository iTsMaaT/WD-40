module.exports = {
    name: "logs",
    /**
     * Displays or changes the console log output mode.
     * @param {import("discord.js").Client} client The Discord client.
     * @param {object} logger The application logger.
     * @param {string[]} args The requested mode, either "all" or "error".
     */
    execute(client, logger, args) {
        const mode = args[0]?.toLowerCase();
        if (!mode || !["all", "error"].includes(mode)) {
            console.log(`Usage: logs <all|error>\nCurrent mode: ${logger.getConsoleLogMode()}`);
            return;
        }
        logger.setConsoleLogMode(mode);
        console.warner(`Console log mode set to: ${mode}`);
    },
};