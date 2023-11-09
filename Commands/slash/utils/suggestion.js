const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");

module.exports = {
    name: "suggestion",
    description: "Suggest ideas for the bot",
    type: ApplicationCommandType.ChatInput,
    execute(logger, interaction, client) {
        // Sends the suggestion and other info in a channel
        const suggestion = interaction.options.get("suggestion").value;
        client.channels.cache.get("1040076894932062229").send(`**Suggestion by ${interaction.user} (${interaction.user.tag}) received: **` + suggestion);
        client.channels.cache.get("1040076894932062229").send("- - - - - - - - - - -");
        interaction.reply({ content : "Suggestion received.", ephemeral: true });
        logger.info("Suggestion received");
    },
};
