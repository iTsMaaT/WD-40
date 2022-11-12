import AbstractCommand from "../AbstractCommand.js";
export default class Sudo extends AbstractCommand{
    execute(message,args) {
        if (message.author.id == 411996978583699456 && args.length > 1) {
            const SudoID = args[0];
            args[0] = "";
            client.channels.cache.get(SudoID).send(args.join(' '));
        }
    }
}