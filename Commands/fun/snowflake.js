module.exports = {
    name: "snowflake",
    description: "Reacts :snowflake: to every message of a user, no args to reset",
    execute(logger, client, message, args) {
        if (message.member.permissions.has("Administrator")) {
            if (args.length == 1) {
                let rawid = args[0].replace("@", "");
                rawdid = rawid.replace("<", "");
                rawid = rawdid.replace(">", "");
                let enabled = snowflakeData.getValue(`${message.guildId}|${rawid}`) ?? false;
                if(!enabled){
                    snowflakeData.setValue(`${message.guildId}|${rawid}`, true);
                    message.reply({ content: `\<\@${rawid}\> is a snowflake`, allowedMentions: { repliedUser: false } });
                } else {
                    snowflakeData.deleteKey(`${message.guildId}|${rawid}`);
                    message.reply({ content: `\<\@${rawid}\> is no longer a snowflake (good for him)`, allowedMentions: { repliedUser: false } });
                }
            }
        }
        else {
            message.channel.send(`You are not allowed to execute that command`);
        }
    }
}
