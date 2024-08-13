const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "suggestion",
    description: "Suggest ideas for the bot",
    usage: {
        required: {
            "suggestion": "The suggestion you want to send",
        },
    },
    category: "utils",
    async execute(logger, client, message, args, optionalArgs) {

        if (!process.env.SUGGESTION_CHANNEL_ID) return await message.reply({ embeds: [embedGenerator.error("No suggestion channel has been set by the owner.")] });

        const channel = await client.channels.fetch(process.env.SUGGESTION_CHANNEL_ID);
        const sent = await channel.send(`**Suggestion by ${interaction.user} (${interaction.user.tag}) received: **` + suggestion);
        await channel.send("===================");
        await sent.react("🔴");
        await sent.react("🟢");
        await sent.react("✅");
        logger.info("Suggestion received");
        await message.reply({ embeds: [embedGenerator.info("Your suggestion has been sent.\nFor a bug report, you can join the support server by doing >help")] });
    },
};
