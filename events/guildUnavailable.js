const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildUnavailable,
    once: false,
    execute(client, logger, guild) {
        logger.severe(`A guild is unavailable, likely because of a server outage: ${guild}`);
        client.channels.cache.get("1048076076653486090").send(`A guild is unavailable, likely because of a server outage: ${guild}`);
    },
};