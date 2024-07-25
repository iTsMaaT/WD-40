const { activities } = require("@root/utils/config.json");
const { ActivityType } = require("discord.js");

module.exports = {
    name: "activity",
    description: "Changes the bot's activity status",
    category: "utils",
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
    async execute(logger, client, message, args, optionalArgs) {
        if (!args[0] && !optionalArgs["preset|p"] && !optionalArgs["list|l"]) {
            client.user.setActivity(activities[Math.floor(Math.random() * activities.length)], { type: ActivityType.Custom });
            return await message.reply({ content: "Activity randomised" });
        }

        if (optionalArgs["list|l"]) {
            let activityList = "";
            const maxIndexWidth = (activities.length - 1).toString().length;
            activities.forEach((activity, index) => {
                const formattedIndex = `[${index.toString().padStart(maxIndexWidth, " ")}]`;
                activityList += `${formattedIndex} : ${activity.name}\n`;
            });
            return await message.reply({ content: `\`\`\`${activityList}\`\`\`` });
        }

        if (optionalArgs["preset|p"]) {
            client.user.setActivity(activities[optionalArgs["preset|p"]], { type: ActivityType.Custom });
            return await message.reply({ content: `Activity changed to : \`${activities[optionalArgs["preset|p"]]}\``  });
        }

        await message.reply({ embeds: [embedGenerator.warning("Invalid activity")] });
    },
};