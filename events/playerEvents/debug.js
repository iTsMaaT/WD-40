const config = require("@utils/config/configUtils");

module.exports = {
    name: "debug",
    once: false,
    /**
     * Logs a discord-player queue event when queue-event logging is enabled.
     * @param {import("discord.js").Client} client The Discord client.
     * @param {object} logger The application logger.
     * @param {string} log The player event message.
     */
    execute(client, logger, log) {
        if (config.get("discordPlayer").logQueueEvents)
            logger.debug("Player event:", log);
    },
};