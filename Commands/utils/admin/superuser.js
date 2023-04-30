const USERID = require("../../../UserIDs.js");
module.exports = {
    name: "superuser",
    description: "Placeholder to log the command",
    category: "utils",
    private: true,
    execute(logger, client, message, args) {
        //Superuser command (Only iTsMaaT can execute commands)
        if (message.author.id == USERID.itsmaat && superuser) {
            superuser = 1;
            message.reply("Only you can execute commands now.");
        } else if (message.author.id == USERID.itsmaat && !superuser) {
            superuser = 0;
            message.reply("Everyone can execute commands");
        } else if (!message.author.id == USERID.itsmaat) {
            message.reply(`You are not allowed to execute that command`);
        }
    }
}