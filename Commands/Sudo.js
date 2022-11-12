import AbstractCommand from "../AbstractCommand.js";
export default class Sudo extends AbstractCommand{
    execute(message,args) {
        if (message.author.id == 411996978583699456 && args.length > 2) {
            if (args[0] == "-s") {
                const SudoID = args[1];
                args[0] = "";
                args[1] = "";
                client.channels.cache.get(SudoID).send(args.join(' '));
            }
            /*else if(args[0] == "-r") {
                const SudoID = args[1];
                const MsgID = args[2];
                args[0] = "";
                args[1] = "";
                args[2] = "";
                client.guilds.cache.get(SudoID).messages.fetch(MsgID).then(async m => {
                    await m.reply(args.join(' '));
                });
            }*/
        }
    }
}
