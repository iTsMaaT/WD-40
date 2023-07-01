module.exports = {
    name: "status",
    description: "Changes the bot's activity status",
    category: "utils",
    private: true,
    execute(logger, client, message, args) {
        //Changes the presence of the bot

        if (message.author.id != process.env.OWNER_ID) return;

        switch(args[0] ?? "dnd") {
        case "donotdisturb":
        case "dnd": 
            client.user.setPresence({ status: 'dnd' });
            break;
        case "online" : {
            client.user.setPresence({ status: 'online' });
            break;
        }
        case "invisible":
        case "offline" : 
            client.user.setPresence({ status: 'invisible' });
            break;
        case "idle" : {
            client.user.setPresence({ status: 'idle' });
            break;
        }
        default : {
            client.user.setPresence({ status: 'dnd' });
        }
        }
    }
};