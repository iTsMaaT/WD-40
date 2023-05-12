module.exports = {
    name: "prefix",
    description: "Changes the prefix to do commands",
    category: "utils",
    async execute(logger, client, message, args) {
        if (args.length == 1) {
            //set or deletes the prefix, if a custom one was already applied
            await global.GuildManager.TogglePrefix(message.guild, args[0]);
            message.reply({ content: `The new prefix is \`${args[0]}\` in \`${message.member.guild.name}\``, allowedMentions: { repliedUser: false } });
            logger.info(`Prefix changed to ${args[0]} in \`${message.member.guild.name}\``);
        }
        else if (args.length == 0) {
            //No prefix error message
            message.reply(`You didn't enter a prefix, dumbass`);
        }
        else {
            //Multiple prefix error message
            message.reply(`You cannot have multiple prefixes retarb`);
        }
    }
}