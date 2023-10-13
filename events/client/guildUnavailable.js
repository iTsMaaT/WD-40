const { Events } = require("discord.js");

module.exports = {
    name: Events.GuildUnavailable,
    once: false,
    log: true,
    execute(client, logger, guild) {
        logger.severe(`A guild is unavailable, likely because of a server outage: ${guild.name} (${guild.id})`);
    },
};