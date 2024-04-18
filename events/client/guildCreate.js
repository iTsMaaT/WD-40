const { Events } = require("discord.js");
const { guildblacklist } = require("@root/utils/config.json");
const GuildManager = require("@root/utils/GuildManager");

module.exports = {
    name: Events.GuildCreate,
    once: false,
    log: true,
    async execute(client, logger, guild) {
        await GuildManager.SetActiveOrCreate(guild);
        logger.info(`The bot has been added to \`${guild.name}\``);
        client.channels.cache.get(process.env.MEMBERS_UPDATE_ID).send(`The bot has been added to \`${guild.name}\``);
        if (guildblacklist.includes(guild.id)) guild.leave();
    },
};