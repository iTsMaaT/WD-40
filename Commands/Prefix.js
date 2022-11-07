import AbstractCommand from "../AbstractCommand.js";

//changes the prefix to do commands
export default class Prefix extends AbstractCommand{
    execute(message,args) {
        if(args.length == 1) {
            prefix = args[0];
            message.channel.send (`The new prefix is \`${args[0]}\``);
            console.log(`Prefix changed to ${args[0]}`)
        }
        else {
            message.reply(`You didn't enter a prefix, dumbass`);
        }
    }
}