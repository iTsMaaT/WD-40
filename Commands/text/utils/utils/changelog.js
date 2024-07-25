const changelog = require("@root/changelogs.json");
const GuildManager = require("@root/utils/GuildManager.js");

module.exports = {
    name: "changelog",
    description: "Displays the latest changes to the bot",
    category: "utils",
    aliases: ["changelogs", "cl"],
    execute(logger, client, message, args, optionalArgs) {
        const latestChanges = changelog.slice(-5);

        const changelogEmbed = {
            title: "Changelogs",
            description: latestChanges
                .map(({ version, date, changes }) => {
                    const changeList = changes.map(change => `- ${change}`).join("\n").substring(0, 1000) + "...";
                    return `**Version: ${version}** (${date}):\n${changeList}\n`;
                })
                .join("\n"),
            color: 0xffffff, 
            timestamp: new Date(),
        };

        const prefix = GuildManager.GetPrefix(message.guild);
        message.reply({ embeds: [changelogEmbed], content: `For help: ${prefix}help` });
    },
};
