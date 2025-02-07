const { ApplicationCommandType, MessageFlags } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { useMainPlayer } = require("discord-player");
const getURLs = require("@functions/getURLs");
const config = require("@utils/config/configUtils");

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
            for (const link of queries) {
                await player.play(interaction.member.voice.channel.id, link, {
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
            }

            const sentMessage = await interaction.followUp({ embeds: [embedGenerator.success({
                title: "Links added to queue",
                description: `Added ${queries.length} quer${queries.length > 1 ? "ies" : "y"} to the queue.`,
            })] });
            await client.commands.get("nowplaying").execute(logger, client, sentMessage, [], {});
        } catch (error) {
            logger.error(error);
            await sentMessage.edit({ embeds: [embedGenerator.error("An error occurred while processing the links.")] });
        }
    },
};