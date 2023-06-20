module.exports = {
    name: "responses",
    description: "Enables/Disables auto-responses",
    category: "utils",
    private: true,
    async execute(logger, client, message, args) {
        if (!message.author.id == process.env.OWNER_ID) return message.reply(`You are not allowed to execute that command`);
        
        //Enable/disable command (Disables auto-responses)
        if (global.GuildManager.GetResponses(message.guild)) {
            await global.GuildManager.ToggleResponses(message.guild, false);
            message.reply("Responses disabled.");
        } else {
            await global.GuildManager.ToggleResponses(message.guild, true);
            message.reply("Responses enabled.");
        }
    }
};