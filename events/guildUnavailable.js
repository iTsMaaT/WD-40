const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildUnavailable,
    once: false,
    execute(client, logger, guild) {
        logger.severe(`A guild is unavailable, likely because of a server outage: ${guild}`);
        client.channels.cache.get("1037141235451842701").send(`A guild is unavailable, likely because of a server outage: ${guild}`);
    },
};