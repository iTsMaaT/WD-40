import AbstractCommand from "../AbstractCommand.js";

//Reacts :snowflake: to every message of a user, no args to reset
export default class Snowflake extends AbstractCommand{
    execute(message,args) {
        if (args.length == 1) {
            SnowflakeID = args[0];
            message.channel.send (`\<\@${SnowflakeID}\> is a snowflake`);
        }
        else {
            SnowflakeID = 0;
            message.channel.send (`Snowflake has been reset`);
        }
    }

}
