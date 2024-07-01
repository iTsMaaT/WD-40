const { activities } = require("@root/utils/config.json");
const { ActivityType } = require("discord.js");

module.exports = {
    name: "activity",
    description: "Changes the bot's activity status",
    category: "utils",
    private: true,
    execute(logger, client, message, args, found) {
        // Changes the activity or gives a list of all presets

        if (!args[0]) {
            client.user.setActivity(activities[Math.floor(Math.random() * activities.length)], { type: ActivityType.Custom });
            message.reply({ content: "Activity randomised" });
            return;
        }
        switch (args[0]) {
            case "-l": {
                let activityList = "";
                const maxIndexWidth = (activities.length - 1).toString().length;
                activities.forEach((activity, index) => {
                    const formattedIndex = `[${index.toString().padStart(maxIndexWidth, " ")}]`;
                    activityList += `${formattedIndex} : ${activity}\n`;
                });
                message.reply({ content: `\`\`\`${activityList}\`\`\`` });
                break;
            }
            case "-p":
                client.user.setActivity(activities[args[1]], { type: ActivityType.Custom });
                message.reply({ content: `Activity changed to : \`${activities[args[1]]}\``  });
                break;
            default:
                client.user.setActivity(args.join(" "), { type: ActivityType.Custom });
                message.reply({ content: "Activity updated"  });
        }
    },
};