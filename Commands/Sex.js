import AbstractCommand from "../AbstractCommand.js";

//starts from a random number, then counts everytime a precise user says sex, no args to reset
export default class Sex extends AbstractCommand{
    execute(message,args) {
        if (message.member.permissions.has("MentionEveryone")) {
            if (args.length == 1) {
                SexID = args[0];
                message.channel.send (`\<\@${SexID}\> is too horny`);
                SexCount = Math.floor(Math.random()*100000) + 1;
            }
            else {
                SexID = 0;
                message.channel.send (`Sex is reset`);
            }
        }
        else {
            message.channel.send(`You are not allowed to execute that command`);
        }
    }
}
