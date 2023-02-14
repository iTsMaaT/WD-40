module.exports = {
    name: "suggestion",
    description: "Suggest ideas for the bot",
    category: "utils",
    execute(logger, client, message, args) {
        
        client.channels.cache.get("1040076894932062229").send(`**Suggestion by ${message.author} (${message.member.user.tag}) received: **` + args.join(' '));
        client.channels.cache.get("1040076894932062229").send(`- - - - - - - - - - -`);
        message.reply(`Suggestion received.`);
        logger.info(`Suggestion received`);
    }
}
