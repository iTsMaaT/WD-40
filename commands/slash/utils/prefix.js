import { ApplicationCommandType, ApplicationCommandOptionType, MessageFlags } from "discord.js";
import * as discordFunctions from "#functions/discordFunctions.js";
const { SendErrorEmbed } = discordFunctions;
import GuildManager from "#guildManager";
import dbManager from "#root/utils/db/databaseManager.js";
import embedGenerator from "#utils/helpers/embedGenerator.js";

export default {
    name: "prefix",
    description: "Changes the prefix to do commands",
    dbNeeded: false,
    admin: true,
    type :ApplicationCommandType.ChatInput,
    options: [
        {
            name: "prefix",
            description: "The new prefix",
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],

    /**
     * @param {import("#utils/log.js")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").ChatInputCommandInteraction} interaction The interaction that triggered the command
     * @param {import("discord.js").Client} client The Discord client instance
     * @returns {Promise<void>}
     */
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