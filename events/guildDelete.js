const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildDelete,
    once: false,
    async execute(client, logger, member) {
        await global.GuildManager.SetActiveOrCreate(guild, false);
        logger.info(`The bot has been removed from \`${guild.name}\``);
        client.channels.cache.get("1048076076653486090").send(`The bot has been removed from \`${guild.name}\``);
    },
};