module.exports = {
    name: "prefix",
    description: "Changes the prefix to do commands",
    category: "utils",
    async execute(logger, client, message, args) {
      if (args.length === 1) {
        // Set or delete the prefix if a custom one was already applied
        await global.GuildManager.TogglePrefix(message.guild, args[0]);
        const responseEmbed = {
          title: "Prefix Changed",
          color: 0xffffff, 
          description: `The new prefix is \`${args[0]}\` in \`${message.member.guild.name}\``,
          timestamp: new Date(),
        };
        message.reply({ embeds: [responseEmbed], allowedMentions: { repliedUser: false } });
        logger.info(`Prefix changed to ${args[0]} in \`${message.member.guild.name}\``);
      } else if (args.length === 0) {
        // No prefix error message
        const errorEmbed = {
          title: "Prefix Error",
          color: 0xffff00, 
          description: "You didn't enter a prefix",
          timestamp: new Date(),
        };
        message.reply({ embeds: [errorEmbed], allowedMentions: { repliedUser: false } });
      } else {
        // Multiple prefix error message
        const errorEmbed = {
          title: "Prefix Error",
          color: 0xffff00, 
          description: "You cannot have multiple prefixes",
          timestamp: new Date(),
        };
        message.reply({ embeds: [errorEmbed], allowedMentions: { repliedUser: false } });
      }
    },
  };