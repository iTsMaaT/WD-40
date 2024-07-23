const { PresenceUpdateStatus } = require("discord.js");

module.exports = {
    name: "status",
    description: "Changes the bot's activity status",
    category: "utils",
    usage: {
        required: {
            "status": "status to change to",
        },
    },
    private: true,
    async execute(logger, client, message, args, optionalArgs) {
        switch (args[0]) {
            case "donotdisturb":
            case "dnd": 
            case "red":
                await client.user.setPresence({ status: PresenceUpdateStatus.DoNotDisturb });
                break;
            case "online" :
            case "green":
            case "available":
                await client.user.setPresence({ status: PresenceUpdateStatus.Online });
                break;
            case "invisible":
            case "grey":
            case "gray":
            case "offline": 
                await client.user.setPresence({ status: PresenceUpdateStatus.Invisible });
                break;
            case "idle":
            case "yellow":
                await client.user.setPresence({ status: PresenceUpdateStatus.Idle });
                break;
            default : {
                await client.user.setPresence({ status: PresenceUpdateStatus.Online });
            }
        }
        await message.reply("Status changed to: " + args[0] ?? "Online");
    },
};