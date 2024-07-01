const { SendErrorEmbed } = require("@functions/discordFunctions");
const GuildManager = require("@root/utils/GuildManager");

module.exports = {
    name: "prefix",
    description: "Changes the prefix used to do commands",
    usage: {
        required: {
            "prefix": "the new prefix for the guild",
        },
    },
    category: "utils",
    admin: true,
    examples: ["!"],
    async execute(logger, client, message, args, found) {
        if (args.length > 3) return SendErrorEmbed(message, "Prefix can't have more than 3 characters", "yellow");
        if (args.length === 0) return SendErrorEmbed(message, "You must enter a prefix.", "yellow");

        const newPrefix = args[0].substring(0, 3);
        await GuildManager.TogglePrefix(message.guild, newPrefix);
        const responseEmbed = {
            title: "Prefix Changed",
            color: 0xffffff, 
            description: `The new prefix is \`${newPrefix}\` in \`${message.member.guild.name}\``,
            timestamp: new Date(),
        };
        message.reply({ embeds: [responseEmbed]  });
        logger.info(`Prefix changed to ${newPrefix} in \`${message.member.guild.name}\``);
    },
};