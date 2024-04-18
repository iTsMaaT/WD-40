const { Events } = require("discord.js");
const GuildManager = require("@root/utils/GuildManager");

module.exports = {
    name: Events.GuildDelete,
    once: false,
    log: true,
    async execute(client, logger, guild) {
        await GuildManager.SetActiveOrCreate(guild, false);
        logger.info(`The bot has been removed from \`${guild.name}\``);
        client.channels.cache.get(process.env.MEMBERS_UPDATE_ID).send(`The bot has been removed from \`${guild.name}\``);
    },
};