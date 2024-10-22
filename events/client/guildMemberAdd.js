const { Events } = require("discord.js");

module.exports = {
    name: Events.GuildMemberAdd,
    once: false,
    execute(client, logger, member) {
        logger.info(`${member.user.tag} (${member.id}) joined \`${member.guild.name}\``);
        if (!process.env.MEMBERS_UPDATE_ID) return;
        client.channels.cache.get(process.env.MEMBERS_UPDATE_ID).send(`${member.user.tag} (<@${member.id}>) joined \`${member.guild.name}\``);
    },
};