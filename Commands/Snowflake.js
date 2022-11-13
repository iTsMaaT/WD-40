
//Reacts :snowflake: to every message of a user, no args to reset
module.exports={
    name:"snowflake",
    description:"Reacts :snowflake: to every message of a user, no args to reset",
    execute(message,args) {
        if (message.member.permissions.has("MentionEveryone")) {
            if (args.length == 1) {
                const rawid1 =  args[0].replace("@", "")
                const rawdid2 = rawid1.replace("<", "")
                SnowflakeID = rawdid2.replace(">", "")
                message.channel.send (`\<\@${SnowflakeID}\> is a snowflake`);
            }
            else {
                SnowflakeID = 0;
                message.channel.send (`Snowflake has been reset`);
            }
        }   
        else {
            message.channel.send(`You are not allowed to execute that command`);
        }
    }
}
