module.exports = {
    name: "snowflake",
    description: "Reacts :snowflake: to every message of a user",
    category: "fun",
    async execute(logger, client, message, args) {
        //Checks if the person executing the command is iTsMaaT or the server's owner
        if (message.member.permissions.has("Administrator") || message.author.id == process.env.OWNER_ID) {
            if (args.length == 1) {
                //Transforms a ping into the ID
                let rawid = args[0].replace("@", "");
                rawdid = rawid.replace("<", "");
                const strid = rawdid.replace(">", "");
                rawid = parseInt(rawdid.replace(">", ""));
                //Uses the database to add or remove the person from the list
                let guildId = parseInt(message.guildId);
                let enabled = (await prisma.snowflake.findFirst({where:{GuildID:guildId,UserID:rawid}})) != null;
                if(!enabled){
                    global.snowflakeData.push([guildId,rawid]);
                    await prisma.snowflake.create({data:{GuildID:guildId,UserID:rawid}})
                    message.reply({ content: `\<\@${strid}\> is a snowflake`, allowedMentions: { repliedUser: false } });
                } else {
                    global.snowflakeData = snowflakeData.filter(v => !v.equals([guildId, rawid]));
                    await prisma.snowflake.delete({where:{GuildID_UserID: {GuildID:guildId,UserID:rawid}}})
                    message.reply({ content: `\<\@${strid}\> is no longer a snowflake (good for him)`, allowedMentions: { repliedUser: false } });
                }
            }
        }
        else {
            message.channel.send(`You are not allowed to execute that command`);
        }
    }
}
