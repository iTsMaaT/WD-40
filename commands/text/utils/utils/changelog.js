const changelog = require("@root/changelogs.json");
const GuildManager = require("@guildManager");

module.exports = {
    name: "changelog",
    description: "Displays the latest changes to the bot",
    category: "utils",
    aliases: ["changelogs", "cl"],

    /**
     * @param {import("@utils/log")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    execute(logger, client, message, args, flags) {
        const latestChanges = changelog.slice(-5);

        const changelogEmbed = {
            title: "Changelogs",
            description: latestChanges
                .map(({ version, date, changes }) => {
                    const changeList = changes.map(change => `- ${change}`).join("\n").substring(0, 1000) + "...";
                    return `**Version: ${version}** (${date}):\n${changeList}\n`;
                })
                .reverse()
                .join("\n"),
            color: 0xffffff, 
            timestamp: new Date(),
        };

        const prefix = GuildManager.GetPrefix(message.guild.id);
        message.reply({ embeds: [changelogEmbed], content: `For help: ${prefix}help` });
    },
};
