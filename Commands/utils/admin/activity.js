const { activities } = require("../../../utils/config.json")

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
            message.reply({ content: `Activity randomised`, allowedMentions: { repliedUser: false } });
            return;
        }
        switch (args[0]) {
            case "-l":
                let activityList = "";
                let maxIndexWidth = (activities.length - 1).toString().length;
                activities.forEach((activity, index) => {
                    let formattedIndex = `[${index.toString().padStart(maxIndexWidth, " ")}]`;
                    activityList += `${formattedIndex} : ${activity}\n`
                });
                message.reply({ content: `\`\`\`${activityList}\`\`\``, allowedMentions: { repliedUser: false } });
                break;
            case "-p":
                client.user.setActivity(activities[args[1]]);
                message.reply({ content: `Activity changed to : \`${activities[args[1]]}\``, allowedMentions: { repliedUser: false } });
                break;
            default:
                client.user.setActivity(args.join(' '));
                message.reply({ content: `Activity updated`, allowedMentions: { repliedUser: false } });
        }
    }
}