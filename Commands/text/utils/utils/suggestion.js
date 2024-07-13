module.exports = {
    name: "suggestion",
    description: "Suggest ideas for the bot",
    usage: "< [Suggestion] >",
    category: "utils",
    async execute(logger, client, message, args, optionalArgs) {
        
        // Sends the suggestion and other info in a channel
        const channel = await client.channels.fetch(process.env.SUGGESTION_CHANNEL_ID);
        const sent = await channel.send(`**Suggestion by ${interaction.user} (${interaction.user.tag}) received: **` + suggestion);
        await channel.send("===================");
        await sent.react("🔴");
        await sent.react("🟢");
        await sent.react("✅");
        message.reply("Suggestion received.\nIf it's a bug report, you can join the support server via the help command");
        logger.info("Suggestion received");
    },
};
