const USERID = require("../../../UserIDs.js");
module.exports = {
    name: "enable",
    description: "Placeholder to log the command",
    category: "utils",
    private: true,
    execute(logger, client, message, args) {
        //Enable/disable command (Disables auto-responses)
        if (message.author.id == USERID.itsmaat && CmdEnabled) {
            CmdEnabled = 0;
            message.reply("Responses disabled.");
        } else if (message.author.id == USERID.itsmaat && !CmdEnabled) {
            CmdEnabled = 1;
            message.reply("Responses enabled.");
        } else if (!message.author.id == USERID.itsmaat) {
            message.reply(`You are not allowed to execute that command`);
        }
    }
}