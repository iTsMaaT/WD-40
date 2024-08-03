const { Events } = require("discord.js");
const config = require("@utils/config/configUtils");
const GuildManager = require("@root/utils/GuildManager");

module.exports = {
    name: Events.GuildCreate,
    once: false,
    log: true,
    async execute(client, logger, guild) {
        const guildblacklist = config.get("guildBlacklist");
        await GuildManager.SetActiveOrCreate(guild);
        logger.info(`The bot has been added to \`${guild.name}\``);
        client.channels.cache.get(process.env.MEMBERS_UPDATE_ID).send(`The bot has been added to \`${guild.name}\``);
        if (guildblacklist.includes(guild.id)) await guild.leave();
    },
};