module.exports={
    name:"sudo",
    description:"idk",
    execute(client,message,args) {
        if (message.author.id == 411996978583699456 && args.length > 1) {
            let sudoprefix = args.shift();
            if (sudoprefix == "-s") {
                const SudoID = args.shift();
                client.channels.cache.get(SudoID).send(args.join(' '));
            }
            else if (sudoprefix == "-r") {
                const ChannelID = args.shift();
                const MsgID = args.shift();
                client.channels.cache.get(ChannelID).messages.cache.get(MsgID).fetch().then(m => m.reply(args.join(' ')));
            }
        }
        console.log("Sudo used");
    }
}
