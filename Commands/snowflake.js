module.exports = {
    name: "snowflake",
    description: "Reacts :snowflake: to every message of a user, no args to reset",
    execute(client, message, args) {
        if (message.member.permissions.has("Administrator")) {
            if (args.length == 1) {
                const rawid1 = args[0].replace("@", "");
                const rawdid2 = rawid1.replace("<", "");
                SnowflakeID = rawdid2.replace(">", "");
                message.reply({ content: `\<\@${SnowflakeID}\> is a snowflake`, allowedMentions: { repliedUser: false } });
            }
            else {
                SnowflakeID = 0;
                message.channel.send(`Snowflake has been reset`);
            }
        }
        else {
            message.channel.send(`You are not allowed to execute that command`);
        }
    }
}
