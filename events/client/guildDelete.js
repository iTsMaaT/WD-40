const { Events } = require("discord.js");
const GuildManager = require("@guildManager");
const { repositories } = require("@utils/db/tableManager.js");
const dbManager = require("@utils/db/databaseManager");

module.exports = {
    name: Events.GuildDelete,
    once: false,
    log: true,
    async execute(client, logger, guild) {
        if (dbManager.dbExists()) {
            try {
                const DBguildIDs = (await repositories.guildsettings.select()).map(item => item.guildId);
                const botGuildIds = client.guilds.cache.map(gui => gui.id);
                const notInGuildIds = DBguildIDs.filter(id => !botGuildIds.includes(id));
                for (const notInGuildId of notInGuildIds) 
                    await GuildManager.SetActiveOrCreate({ id: notInGuildId }, false);
            } catch (error) {
                logger.error("Error while deleting guild from database: " + error);
            }
        }
        
        if (!guild.available || !guild.name) return;
        logger.info(`The bot has been removed from \`${guild.name}\``);
        client.channels.cache.get(process.env.GUILD_UPDATE_ID)?.send(`The bot has been removed from \`${guild.name}\``);
    },
};