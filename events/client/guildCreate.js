import { Events } from "discord.js";
import config from "#utils/config/configUtils.js";
import GuildManager from "#guildManager";

export default {
    name: Events.GuildCreate,
    once: false,
    log: true,
    /**
     * Records and announces a guild the bot has joined, leaving it if it is blacklisted.
     * @param {import("discord.js").Client} client The Discord client.
     * @param {object} logger The application logger.
     * @param {import("discord.js").Guild} guild The guild the bot joined.
     */
    async execute(client, logger, guild) {
        const guildblacklist = config.get("GUILD_BLACKLIST");
        await GuildManager.SetActiveOrCreate(guild);
        logger.info(`The bot has been added to \`${guild.name}\``);
        client.channels.cache.get(process.env.GUILD_UPDATE_ID)?.send(`The bot has been added to \`${guild.name}\``);
        if (guildblacklist.includes(guild.id)) await guild.leave();
    },
};