const config = require("@config/configUtils");
const { ActivityType } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator.js");

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
    async execute(logger, client, message, args, flags) {
        const activities = config.get("activities");
        if (!flags["preset|p"] && !flags["list|l"]) {
            if (!args[0]) {
                client.user.setActivity(activities[Math.floor(Math.random() * activities.length)], { type: ActivityType.Custom });
                return await message.reply({ embeds: [embedGenerator.success("Activity randomised")] });
            } else {
                client.user.setActivity(args.join(" "), { type: ActivityType.Custom });
                return await message.reply({ embeds: [embedGenerator.success(`Activity changed to : \`${args.join(" ")}\``)] });
            }
        }

        if (flags["list|l"]) {
            let activityList = "";
            const maxIndexWidth = (activities.length - 1).toString().length;
            activities.forEach((activity, index) => {
                const formattedIndex = `[${index.toString().padStart(maxIndexWidth, " ")}]`;
                activityList += `${formattedIndex} : ${activity.name}\n`;
            });
            return await message.reply({ embeds: [embedGenerator.info("Available activities", `\`\`\`${activityList}\`\`\``)] });
        }

        if (flags["preset|p"]) {
            client.user.setActivity(activities[flags["preset|p"]], { type: ActivityType.Custom });
            return await message.reply({ embeds: [embedGenerator.success(`Activity changed to : \`${activities[flags["preset|p"]]}\``)] });
        }

        await message.reply({ embeds: [embedGenerator.warning("Invalid activity")] });
    },
};