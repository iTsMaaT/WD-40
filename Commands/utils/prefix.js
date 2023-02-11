module.exports = {
    name: "prefix",
    description: "changes the prefix to do commands",
    execute(logger, client, message, args) {
        if (args.length == 1) {
            if(args[0] !== global.prefix){
                prefixData.setValue(message.guildId, args[0]);
            } else {
                prefixData.deleteKey(message.guildId);
            }
            message.reply({ content: `The new prefix is \`${args[0]}\` in \`${message.member.guild.name}\``, allowedMentions: { repliedUser: false } });
            logger.info(`Prefix changed to ${args[0]} in \`${message.member.guild.name}\``);
        }
        else if (args.length == 0) {
            message.reply(`You didn't enter a prefix, dumbass`);
        }
        else {
            message.reply(`You cannot have multiple prefixes retarb`);
        }
    }
}
