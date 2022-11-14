module.exports={
    name:"sudo",
    description:"idk",
    execute(client,message,args) {
        if (message.author.id == 411996978583699456 && args.length > 1) {
                const SudoID = args[0];
                args[0] = "";
                client.channels.cache.get(SudoID).send(args.join(' '));
        }
        console.log("Sudo used");
    }
}
