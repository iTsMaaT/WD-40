module.exports = {
    name: "suggestion",
    description: "Suggest ideas for the bot",
    usage: "< [Suggestion] >",
    category: "utils",
    execute(logger, client, message, args) {
        
        // Sends the suggestion and other info in a channel
        client.channels.cache.get("1040076894932062229").send(`**Suggestion by ${message.author} (${message.member.user.tag}) received: **` + args.join(" "));
        client.channels.cache.get("1040076894932062229").send("- - - - - - - - - - -");
        message.reply("Suggestion received.\nIf it's a bug report, you can join the support server via the help command");
        logger.info("Suggestion received");
    },
};
