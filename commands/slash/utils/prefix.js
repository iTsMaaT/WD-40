const { ApplicationCommandType, ApplicationCommandOptionType, MessageFlags } = require("discord.js");
const { SendErrorEmbed } = require("@functions/discordFunctions");
const GuildManager = require("@guildManager");
const dbManager = require("@root/utils/db/databaseManager");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "prefix",
    description: "Changes the prefix to do commands",
    dbNeeded: false,
    type :ApplicationCommandType.ChatInput,
    options: [
        {
            name: "prefix",
            description: "The new prefix",
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    async execute(logger, interaction, client) {
        // set or deletes the prefix, if a custom one was already applied
        const prefix = interaction.options.get("prefix")?.value?.replace(/\s/g, "") || "";
        if (prefix.length > 3) return await interaction.editReply({ embeds: [embedGenerator.warning("Prefix can't have more than 3 characters")], flags: MessageFlags.Ephemeral });
        if (prefix.length === 0) return await interaction.editReply({ embeds: [embedGenerator.info(`The prefix is \`${GuildManager.GetPrefix(interaction.guild.id)}\``)] });

        if (!dbManager.dbExists()) {
            return await interaction.editReply({ embeds: [embedGenerator.error({
                title: "Cannot run command",
                description: "A database connection is required to run this command.",
            })] });
        }

        const newPrefix = prefix.substring(0, 3);
        await GuildManager.TogglePrefix(interaction.guild, newPrefix);
        const responseEmbed = {
            title: "Prefix Changed",
            color: 0xffffff, 
            description: `The new prefix is \`${newPrefix}\` in \`${interaction.member.guild.name}\``,
            timestamp: new Date(),
        };
        interaction.editReply({ embeds: [responseEmbed]  });
        logger.info(`Prefix changed to ${newPrefix} in \`${interaction.member.guild.name}\``);
    },
};