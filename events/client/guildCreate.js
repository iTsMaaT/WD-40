const { Events } = require('discord.js');
const { guildblacklist } = require('@root/utils/config.json');

module.exports = {
    name: Events.GuildCreate,
    once: false,
    async execute(client, logger, guild) {
        await global.GuildManager.SetActiveOrCreate(guild);
        logger.info(`The bot has been added to \`${guild.name}\``);
        client.channels.cache.get(process.env.MEMBERS_UPDATE_ID).send(`The bot has been added to \`${guild.name}\``);
        if (guildblacklist.includes(guild.id)) guild.leave();
    },
};