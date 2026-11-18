const config = require("@utils/config/configUtils");

module.exports = {
    name: "debug",
    once: false,
    /**
     * Logs a discord-player debug message when player-event logging is enabled.
     * @param {import("discord.js").Client} client The Discord client.
     * @param {object} logger The application logger.
     * @param {string} log The player debug message.
     */
    execute(client, logger, log) {
        if (config.get("discordPlayer").logPlayerEvents) 
            logger.debug("Player event:", log);
    },
};