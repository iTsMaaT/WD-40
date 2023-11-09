const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");

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
        // Set or delete the prefix if a custom one was already applied
        await global.GuildManager.TogglePrefix(interaction.guild, prefix.charAt(0));
        const responseEmbed = {
            title: "Prefix Changed",
            color: 0xffffff, 
            description: `The new prefix is \`${prefix.charAt(0)}\` in \`${interaction.member.guild.name}\``,
            timestamp: new Date(),
        };
        interaction.reply({ embeds: [responseEmbed]  });
        logger.info(`Prefix changed to ${prefix.charAt(0)} in \`${interaction.member.guild.name}\``);
    },
};