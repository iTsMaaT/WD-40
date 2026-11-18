import { Events } from "discord.js";
import GuildManager from "#guildManager";
import { repositories } from "#utils/db/tableManager.js";
import dbManager from "#utils/db/databaseManager.js";

export default {
    name: Events.GuildDelete,
    once: false,
    log: true,
    /**
     * Updates guild activity records and announces when the bot leaves an available guild.
     * @param {import("discord.js").Client} client The Discord client.
     * @param {object} logger The application logger.
     * @param {import("discord.js").Guild} guild The guild the bot left or lost access to.
     */
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