import { Events } from "discord.js";

export default {
    name: Events.Warn,
    once: false,
    log: true,
    /**
     * Forwards a Discord.js warning to the application logger.
     * @param {import("discord.js").Client} client The Discord client emitting the warning.
     * @param {object} logger The application logger.
     * @param {string} info The warning message.
     */
    execute(client, logger, info) {
        logger.warning(`Warning: ${info}`);
    },
};