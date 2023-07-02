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
        //set or deletes the prefix, if a custom one was already applied
        const prefix = interaction.options.get("prefix").value;
        await global.GuildManager.TogglePrefix(interaction.guild, prefix);
        interaction.reply({ content: `The new prefix is \`${prefix}\` in \`${interaction.member.guild.name}\``  });
        logger.info(`Prefix changed to ${prefix} in \`${interaction.member.guild.name}\``);
    }
};