const { activities } = require("../../../../utils/config.json");

module.exports = {
    name: "activity",
    description: "Changes the bot's activity status",
    category: "utils",
    private: true,
    execute(logger, client, message, args) {
        //Changes the activity or gives a list of all presets

        if (message.author.id != process.env.OWNER_ID) return;
        if (!args[0]) {
            client.user.setActivity(activities[Math.floor(Math.random() * activities.length)]);
            message.reply({ content: `Activity randomised` });
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
            client.user.setActivity(activities[args[1]]);
            message.reply({ content: `Activity changed to : \`${activities[args[1]]}\``  });
            break;
        default:
            client.user.setActivity(args.join(' '));
            message.reply({ content: `Activity updated`  });
        }
    }
};