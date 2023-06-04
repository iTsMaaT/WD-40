const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberAdd,
    once: false,
    execute(client, logger, member) {
        logger.info(`${member.user.tag} (${member.id}) joined \`${member.guild.name}\``);
        client.channels.cache.get("1048076076653486090").send(`${member.user.tag} (<@${member.id}>) joined \`${member.guild.name}\``);
    },
};