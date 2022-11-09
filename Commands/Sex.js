import AbstractCommand from "../AbstractCommand.js";

//starts from a random number, then counts everytime a precise user says lmao, no args to reset
export default class Sex extends AbstractCommand{
    execute(message,args) {
        if (args.length == 1) {
            LmaoID = args[0];
            message.channel.send (`\<\@${LmaoID}\> is laughing is ass out too much`);
            LmaoCount = Math.floor(Math.random()*100000) + 1;
        }
        else {
            LmaoID = 0;
            message.channel.send (`Lmao is reset`);
        }
    }
}
