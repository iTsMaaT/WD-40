const { PresenceUpdateStatus } = require("discord.js");

module.exports = {
    name: "status",
    description: "Changes the bot's activity status",
    category: "utils",
    private: true,
    execute(logger, client, message, args) {
        // Changes the presence of the bot

        if (message.author.id != process.env.OWNER_ID) return;

        switch (args[0]) {
            case "donotdisturb":
            case "dnd": 
            case "red":
                client.user.setPresence({ status: PresenceUpdateStatus.DoNotDisturb });
                break;
            case "online" :
            case "green":
            case "available":
                client.user.setPresence({ status: PresenceUpdateStatus.Online });
                break;
            case "invisible":
            case "grey":
            case "gray":
            case "offline": 
                client.user.setPresence({ status: PresenceUpdateStatus.Invisible });
                break;
            case "idle":
            case "yellow":
                client.user.setPresence({ status: PresenceUpdateStatus.Idle });
                break;
            default : {
                client.user.setPresence({ status: PresenceUpdateStatus.Online });
            }
        }
        message.reply("Status changed to: " + args[0] ?? "Online");
    },
};