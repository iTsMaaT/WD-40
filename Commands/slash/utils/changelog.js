const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const changelog = require('../../../changelogs.json');

module.exports = {
    name: 'changelog',
    description: 'Displays the latest changes to the bot',
    type :ApplicationCommandType.ChatInput,
    execute(logger, interaction, client) {
        const latestChanges = changelog.slice(-5);
        const log = latestChanges.map(({ version, date, changes }) =>
            `**Version: ${version}** (${date}):\n${changes.map(change => `- ${change}`).join('\n')}\n\n`);
        const cleanlog = log.join("").replace(",**Version:**","**Version:**");
        const prefix = global.GuildManager.GetPrefix(interaction.guild);
        interaction.reply({content:
`
For help : ${prefix}help

**Changelogs**
${cleanlog}
`
        });
    },
};
