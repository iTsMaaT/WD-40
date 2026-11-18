import { Events } from "discord.js";

export default {
    name: Events.Debug,
    once: false,
    log: false,
    /**
     * Logs Discord.js debug output when debug logging is enabled.
     * @param {import("discord.js").Client} client The Discord client emitting the event.
     * @param {object} logger The application logger.
     * @param {string} debug The debug message.
     */
    async execute(client, logger, debug) {
        if (process.env.CURRENT_DEBUG_STATE == "1") logger.debug(debug);
    },
};