const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");

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

        if (!process.env.SUGGESTION_CHANNEL_ID) return await interaction.reply({ embeds: [embedGenerator.error("No suggestion channel has been set by the owner.")], ephemeral: true });
        
        const suggestion = interaction.options.get("suggestion").value;
        const channel = await client.channels.fetch(process.env.SUGGESTION_CHANNEL_ID);
        const sent = await channel.send(`**Suggestion by ${interaction.user} (${interaction.user.tag}) received: **` + suggestion);
        await channel.send("===================");
        await sent.react("🔴");
        await sent.react("🟢");
        await sent.react("✅");
        interaction.reply({ embeds: [embedGenerator.info("Your suggestion has been sent.\nFor a bug report, you can join the support server by doing >help")], ephemeral: true });
        logger.info("Suggestion received");
    },
};
