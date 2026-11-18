import { Events } from "discord.js";

export default {
    name: Events.GuildUnavailable,
    once: false,
    log: true,
    /**
     * Reports that a guild has become unavailable.
     * @param {import("discord.js").Client} client The Discord client.
     * @param {object} logger The application logger.
     * @param {import("discord.js").Guild} guild The unavailable guild.
     */
    execute(client, logger, guild) {
        logger.severe(`A guild is unavailable, likely because of a server outage: ${guild.name} (${guild.id})`);
    },
};