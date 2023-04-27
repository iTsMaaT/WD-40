const changelog = require('../../changelogs.json');

module.exports = {
  name: 'changelog',
  description: 'Displays the latest changes to the bot',
  category: 'info',
  execute(logger, client, message, args) {
    const latestChanges = changelog.slice(-3);
    let log = latestChanges.map(({ version, date, changes }) =>
    `**Version: ${version}** (${date}):\n${changes.map(change => `- ${change}`).join('\n')}\n\n`)
    let cleanlog = log.join("").replace(",**Version:**","**Version:**")
    let prefix = prefixData.getValue(message.guildId) ?? global.prefix;
    message.reply({content:
`
For help : ${prefix}help

**Changelogs**
${cleanlog}
`

, allowedMentions: { repliedUser: false } });
  },
};
