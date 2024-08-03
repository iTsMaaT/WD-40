const embedGenerator = require("@utils/helpers/embedGenerator");
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
    async execute(logger, client, message, args, optionalArgs) {
        if (args.length > 3) return await message.reply({ embeds: [embedGenerator.warning("Prefix can't have more than 3 characters")] });
        if (args.length === 0) return await message.reply({ embeds: [embedGenerator.warning("You must enter a prefix.")] });

        const newPrefix = args[0].substring(0, 3);
        await GuildManager.TogglePrefix(message.guild, newPrefix);
        const responseEmbed = embedGenerator.success({
            title: "Prefix Changed",
            description: `The new prefix is \`${newPrefix}\` in \`${message.member.guild.name}\``,
        }).withAuthor(message.author);
        message.reply({ embeds: [responseEmbed]  });
        logger.info(`Prefix changed to ${newPrefix} in \`${message.member.guild.name}\``);
    },
};