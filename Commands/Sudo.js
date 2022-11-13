module.exports={
    name:"sudo",
    description:"idk",
    execute(message,args) {
        if (message.author.id == 411996978583699456 && args.length > 1) {
            //if (args[0] == "-s") {
                const SudoID = args[0];
                args[0] = "";
                //args[1] = "";
                client.channels.cache.get(SudoID).send(args.join(' '));
            //}
            /*else if(args[0] == "-r") {
                const SudoID = args[1];
                args[0] = "";
                args[1] = "";
                client.guilds.cache.get(SudoID).messages.fetch(MsgID).then(async m => {
                    await m.reply(args.join(' '));
                });
            }*/
        }
        console.log("Sudo used");
    }
}
