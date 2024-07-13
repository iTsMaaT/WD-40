const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");

module.exports = {
    name: "suggestion",
    description: "Suggest ideas for the bot",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "suggestion",
            description: "The suggestion to send to the bot's owner",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    async execute(logger, interaction, client) {
        // Sends the suggestion and other info in a channel
        const suggestion = interaction.options.get("suggestion").value;
        const channel = await client.channels.fetch(process.env.SUGGESTION_CHANNEL_ID);
        const sent = await channel.send(`**Suggestion by ${interaction.user} (${interaction.user.tag}) received: **` + suggestion);
        await channel.send("===================");
        await sent.react("🔴");
        await sent.react("🟢");
        await sent.react("✅");
        interaction.reply({ content : "Suggestion received.", ephemeral: true });
        logger.info("Suggestion received");
    },
};
