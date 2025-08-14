const embedGenerator = require("@utils/helpers/embedGenerator");
const GuildManager = require("@guildManager");
const dbManager = require("@root/utils/db/databaseManager");

module.exports = {
    name: "prefix",
    description: "Changes the prefix used to do commands",
    dbNeeded: false,
    usage: {
        required: {
            "prefix": "the new prefix for the guild",
        },
    },
    category: "utils",
    admin: true,
    examples: ["!"],
    async execute(logger, client, message, args, flags) {
        const newPrefix = args[0];
        if (newPrefix?.length > 3) return await message.reply({ embeds: [embedGenerator.warning("Prefix can't have more than 3 characters")] });
        if (!newPrefix) return await message.reply({ embeds: [embedGenerator.info(`The prefix is \`${GuildManager.GetPrefix(message.guild.id)}\``)] });

        if (!dbManager.dbExists()) {
            return await message.reply({ embeds: [embedGenerator.error({
                title: "Cannot run command",
                description: "A database connection is required to run this command.",
            })] });
        }

        await GuildManager.TogglePrefix(message.guild, newPrefix);
        const responseEmbed = embedGenerator.success({
            title: "Prefix Changed",
            description: `The new prefix is \`${newPrefix}\` in \`${message.member.guild.name}\``,
        }).withAuthor(message.author);

        message.reply({ embeds: [responseEmbed]  });
        logger.info(`Prefix changed to ${newPrefix} in \`${message.member.guild.name}\``);
    },
};