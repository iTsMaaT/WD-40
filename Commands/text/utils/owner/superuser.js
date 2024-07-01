module.exports = {
    name: "superuser",
    description: "Makes only iTsMaaT be able to execute commands",
    category: "utils",
    private: true,
    execute(logger, client, message, args, found) {
        // Superuser command (Only iTsMaaT can execute commands)
        const server = process.env.SERVER;
        if (args[0] == server) {
            if (!superuser) {
                superuser = 1;
                message.reply("Only you can execute commands on [" + server + "].");
            } else if (superuser) {
                superuser = 0;
                message.reply("Everyone can execute commands on [" + server + "].");
            } else {
                message.reply("You are not allowed to execute that command");
            }
        }
    },
};