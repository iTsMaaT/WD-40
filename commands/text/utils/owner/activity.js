const config = require("@config/configUtils");
const { ActivityType } = require("discord.js");

module.exports = {
    name: "activity",
    description: "Changes the bot's activity status",
    category: "owner",
    usage: {
        required: {
            "activity": "activity to change to",
        },
        optional: {
            "list|l": {
                hasValue: false,
                description: "Lists all the available activities",
            },
            "preset|p": {
                hasValue: true,
                description: "Changes the activity to a preset",
            },
        },
    },
    private: true,

    /**
     * @param {import("@utils/log")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    async execute(logger, client, message, args, flags) {
        const activities = config.get("activities");
        if (!args[0] && !flags["preset|p"] && !flags["list|l"]) {
            client.user.setActivity(activities[Math.floor(Math.random() * activities.length)], { type: ActivityType.Custom });
            return await message.reply({ content: "Activity randomised" });
        }

        if (flags["list|l"]) {
            let activityList = "";
            const maxIndexWidth = (activities.length - 1).toString().length;
            activities.forEach((activity, index) => {
                const formattedIndex = `[${index.toString().padStart(maxIndexWidth, " ")}]`;
                activityList += `${formattedIndex} : ${activity.name}\n`;
            });
            return await message.reply({ content: `\`\`\`${activityList}\`\`\`` });
        }

        if (flags["preset|p"]) {
            client.user.setActivity(activities[flags["preset|p"]], { type: ActivityType.Custom });
            return await message.reply({ content: `Activity changed to : \`${activities[flags["preset|p"]]}\``  });
        }

        await message.reply({ embeds: [embedGenerator.warning("Invalid activity")] });
    },
};