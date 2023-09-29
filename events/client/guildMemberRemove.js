const { Events } = require('discord.js');

module.exports = {
    name: Events.GuildMemberRemove,
    once: false,
    execute(client, logger, member) {
        logger.info(`${member.user.tag} (${member.id}) left \`${member.guild.name}\``);
        client.channels.cache.get(process.env.MEMBERS_UPDATE_ID).send(`${member.user.tag} (<@${member.id}>) left \`${member.guild.name}\``);
    },
};