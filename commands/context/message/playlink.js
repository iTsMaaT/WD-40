import { ApplicationCommandType, MessageFlags } from "discord.js";
import embedGenerator from "#utils/helpers/embedGenerator.js";
import { useMainPlayer } from "discord-player";
import getURLs from "#functions/getURLs.js";
import config from "#utils/config/configUtils.js";
import { createPaginatedMessage } from "#utils/helpers/createPaginatedMessage.js";

export default {
    name: "Add / Play Links",
    type: ApplicationCommandType.Message,
    ephemeral: true,

    /**
     * @param {import("#utils/log.js")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").MessageContextMenuCommandInteraction} interaction The interaction that triggered the command
     * @param {import("discord.js").Client} client The Discord client instance
     * @returns {Promise<void>}
     */
    async execute(logger, interaction, client) {
        const playerConfig = config.get("discordPlayer");
        const player = useMainPlayer();
        const message = interaction.targetMessage;
        const queries = getURLs(message.content) || [];

        if (!queries || queries.length === 0) 
            queries.push(message.content);
        

        if (!interaction.member.voice.channel) 
            return await interaction.editReply({ embeds: [embedGenerator.error("You must be in a voice channel to use this command.")], flags: MessageFlags.Ephemeral });
        

        await interaction.editReply({ embeds: [embedGenerator.info("Processing links...")], flags: MessageFlags.Ephemeral });

        try {
            const tracks = [];
            for (const link of queries) {
                try {
                    const { track } = await player.play(interaction.member.voice.channel.id, link, {
                        nodeOptions: {
                            metadata: {
                                channel: interaction.channel,
                                client: interaction.guild.members.me,
                                requestedBy: interaction.user,
                                guild: interaction.guild,
                            },
                            verifyFallbackStream: true,
                            ...playerConfig.globalPlayerNodeOptions,
                        },
                        requestedBy: interaction.user,
                    });
                    tracks.push(track);
                } catch (e) { /**/ }
            }

            if (!tracks.length) return interaction.reply({ content: "No tracks found.", ephemeral: true });

            const embed = embedGenerator.success({
                title: "Links added to queue",
                description: `Added ${queries.length} quer${queries.length > 1 ? "ies" : "y"} to the queue.`,
            });
        
            const fields = tracks.map((track, index) => {
                return {
                    name: `[${index.toString().padStart(tracks.length.toString().length, " ")}] - ${track.title} - ${track.author}`,
                    value: `requested by : ${track.requestedBy?.displayName ?? "N/A"}`,
                };
            });

            await createPaginatedMessage(interaction, {
                embed,
                fields,
                fieldsPerPage: 8,
                timeout: 120000,
            });
        } catch (error) {
            logger.error(error);
            await sentMessage.edit({ embeds: [embedGenerator.error("An error occurred while processing the links.")] });
        }
    },
};