const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberRemove,
    once: false,
    execute(client, logger, member) {
        logger.info(`${member.user.tag} (${member.id}) left \`${member.guild.name}\``);
        client.channels.cache.get("1048076076653486090").send(`${member.user.tag} (<@${member.id}>) left \`${member.guild.name}\``);
    },
};