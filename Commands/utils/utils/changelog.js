const changelog = require('../../../changelogs.json');

module.exports = {
  name: 'changelog',
  description: 'Displays the latest changes to the bot',
  category: 'utils',
  execute(logger, client, message, args) {
    const latestChanges = changelog.slice(-5);
    let log = latestChanges.map(({ version, date, changes }) =>
    `**Version: ${version}** (${date}):\n${changes.map(change => `- ${change}`).join('\n')}\n\n`)
    let cleanlog = log.join("").replace(",**Version:**","**Version:**")
    let prefix = global.GuildManager.GetPrefix(message.guild);
    message.reply({content:
`
For help : ${prefix}help

**Changelogs**
${cleanlog}
`

, allowedMentions: { repliedUser: false } });
  },
};