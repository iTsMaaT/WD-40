
//changes the prefix to do commands
module.exports={
    name:"prefix",
    description:"changes the prefix to do commands",
    execute(client,message,args) {
        if(args.length == 1) {
            prefix = args[0];
            message.channel.send (`The new prefix is \`${args[0]}\``);
            console.log(`Prefix changed to ${args[0]}`)
        }
        else if(args.length == 0) {
            message.reply(`You didn't enter a prefix, dumbass`);
        }
        else {
            message.reply(`You cannot have multiple prefixes retarb`);
        }
    }
}