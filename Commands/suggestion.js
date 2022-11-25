module.exports = {
    name: "suggestion",
    description: "suggest",
    execute(client, message, args) {
        
        client.channels.cache.get("1040076894932062229").send(`**Suggestion by ${message.author} (${message.member.user.tag}) received: **` + args.join(' '));
        client.channels.cache.get("1040076894932062229").send(`- - - - - - - - - - -`);
        message.reply(`Suggestion received.`);
        console.log(`Suggestion received`);
    }
}
