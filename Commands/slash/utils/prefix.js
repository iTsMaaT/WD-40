const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const { SendErrorEmbed } = require("@functions/discordFunctions");
const GuildManager = require("@root/utils/GuildManager");

module.exports = {
    name: "prefix",
    description: "Changes the prefix to do commands",
    type :ApplicationCommandType.ChatInput,
    options: [
        {
            name: "prefix",
            description: "The new prefix",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    async execute(logger, interaction, client) {
        // set or deletes the prefix, if a custom one was already applied
        const prefix = interaction.options.get("prefix").value.replace(/\s/g, "");
        if (prefix.length > 3) return await interaction.reply({ embeds: [embedGenerator.warning("Prefix can't have more than 3 characters")], ephemeral: true });
        if (prefix.length === 0) return await interaction.reply({ embeds: [embedGenerator.warning("You must enter a prefix.")], ephemeral: true });

        const newPrefix = prefix.substring(0, 3);
        await GuildManager.TogglePrefix(interaction.guild, newPrefix);
        const responseEmbed = {
            title: "Prefix Changed",
            color: 0xffffff, 
            description: `The new prefix is \`${newPrefix}\` in \`${interaction.member.guild.name}\``,
            timestamp: new Date(),
        };
        interaction.reply({ embeds: [responseEmbed]  });
        logger.info(`Prefix changed to ${newPrefix} in \`${interaction.member.guild.name}\``);
    },
};