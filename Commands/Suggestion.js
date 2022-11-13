module.exports={
    name:"suggestion",
    description:"suggest",
    execute(message,args) {
        client.channels.cache.get("1040076894932062229").send(args.join(' '));
        client.channels.cache.get("1040076894932062229").send(`- - - - - - - - - - -`);
        message.reply(`Suggestion received.`);
        console.log(`Suggestion received`);
    }
}
