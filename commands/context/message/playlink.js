const { ApplicationCommandType, MessageFlags } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { useMainPlayer } = require("discord-player");
const getURLs = require("@functions/getURLs");
const config = require("@utils/config/configUtils");
const { createPaginatedMessage } = require("@utils/helpers/createPaginatedMessage");

module.exports = {
    name: "Add / Play Links",
    type: ApplicationCommandType.Message,
    ephemeral: true,
    async execute(logger, interaction, client) {
        const playerConfig = config.get("discordPlayerConf");
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