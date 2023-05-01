const USERID = require("../../../UserIDs.js");
module.exports = {
    name: "responses",
    description: "Placeholder to log the command",
    category: "utils",
    private: true,
    async execute(logger, client, message, args) {
        if (!message.author.id == USERID.itsmaat) return message.reply(`You are not allowed to execute that command`);
        
        //Enable/disable command (Disables auto-responses)
        if (global.GuildManager.GetResponses(message.guild)) {
            await global.GuildManager.ToggleResponses(message.guild, false);
            message.reply("Responses disabled.");
        } else {
            await global.GuildManager.ToggleResponses(message.guild, true);
            message.reply("Responses enabled.");
        }
    }
}