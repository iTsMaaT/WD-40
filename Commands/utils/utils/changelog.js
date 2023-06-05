const changelog = require('../../../changelogs.json');

module.exports = {
    name: 'changelog',
    description: 'Displays the latest changes to the bot',
    category: 'utils',
    execute(logger, client, message, args) {
        const latestChanges = changelog.slice(-5);

        const changelogEmbed = {
            title: 'Changelogs',
            description: latestChanges
                .map(({ version, date, changes }) => {
                    const changeList = changes.map(change => `- ${change}`).join('\n');
                    return `**Version: ${version}** (${date}):\n${changeList}\n`;
                })
                .join('\n'),
            color: 0xffffff, 
            timestamp: new Date(),
        };

        const prefix = global.GuildManager.GetPrefix(message.guild);
        message.reply({ embeds: [changelogEmbed], content: `For help: ${prefix}help`, allowedMentions: { repliedUser: false } });
    },
};
