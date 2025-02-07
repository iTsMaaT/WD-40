const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ApplicationCommandOptionType } = require("discord.js");
const { prettyString } = require("@functions/formattingFunctions");
const embedGenerator = require("@utils/helpers/embedGenerator");
const GuildManager = require("@guildManager");

module.exports = {
    name: "help",
    description: "Lists commands",
    options: [
        {
            name: "command",
            type: ApplicationCommandOptionType.String,
            description: "Get help for a specific command",
            required: false,
        },
    ],
    async execute(logger, interaction, client) {
        const command = interaction.options.get("command")?.value;

        const sent = await interaction.editReply({ content: "Executing the help text command..." });
        sent.author = interaction.user;
        await client.commands.get("help").execute(logger, client, sent, [command], {});
    },
};