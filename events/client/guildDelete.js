const { Events } = require("discord.js");
const GuildManager = require("@root/utils/GuildManager");
const { repositories } = require("@utils/db/tableManager.js");

module.exports = {
    name: Events.GuildDelete,
    once: false,
    log: true,
    async execute(client, logger, guild) {
        const DBguildIDs = (await repositories.guildsettings.select()).map(item => item.guildId);
        const botGuildIds = client.guilds.cache.map(gui => gui.id);
        const notInGuildIds = DBguildIDs.filter(id => !botGuildIds.includes(id));
        for (const notInGuildId of notInGuildIds) {
            await GuildManager.SetActiveOrCreate({ id: notInGuildId }, false);
            if (!guild.available || !guild.name) return;
        }
        logger.info(`The bot has been removed from \`${guild.name}\``);
        client.channels.cache.get(process.env.MEMBERS_UPDATE_ID).send(`The bot has been removed from \`${guild.name}\``);
    },
};