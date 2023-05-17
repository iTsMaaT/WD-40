module.exports = {
    name: "superuser",
    description: "Makes only iTsMaaT be able to execute commands",
    category: "utils",
    private: true,
    execute(logger, client, message, args) {
        //Superuser command (Only iTsMaaT can execute commands)
        if (message.author.id == process.env.OWNER_ID && !superuser) {
            superuser = 1;
            message.reply("Only you can execute commands now.");
        } else if (message.author.id == process.env.OWNER_ID && superuser) {
            superuser = 0;
            message.reply("Everyone can execute commands");
        } else if (!message.author.id == process.env.OWNER_ID) {
            message.reply(`You are not allowed to execute that command`);
        }
    }
}