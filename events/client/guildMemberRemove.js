import { Events } from "discord.js";

export default {
    name: Events.GuildMemberRemove,
    once: false,
    /**
     * Logs a member leaving a guild and posts the update when configured.
     * @param {import("discord.js").Client} client The Discord client.
     * @param {object} logger The application logger.
     * @param {import("discord.js").GuildMember} member The member who left.
     */
    execute(client, logger, member) {
        logger.info(`${member.user.tag} (${member.id}) left \`${member.guild.name}\``);
        if (!process.env.MEMBERS_UPDATE_ID) return;
        client.channels.cache.get(process.env.MEMBERS_UPDATE_ID).send(`${member.user.tag} (<@${member.id}>) left \`${member.guild.name}\``);
    },
};