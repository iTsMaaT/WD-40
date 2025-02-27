const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue, useTimeline, useHistory, QueueRepeatMode } = require("discord-player");
const { getLoopMode, getPauseMode } = require("@utils/helpers/playerHelpers");
const { findBestMatch, algorithms } = require("@utils/algorithms/findBestMatch");

module.exports = {
    name: "playerpanel",
    description: "Show the player panel with controls",
    aliases: ["pp"],
    category: "music",
    private: true,
    inVoiceChannel: true,
    inSameVoiceChannel: true,
    async execute(logger, client, message, args, optionalArgs) {
        const queue = useQueue();
        const timeline = useTimeline();
        const history = useHistory();

        if (!queue || !queue.currentTrack)
            return await message.reply({ embeds: [embedGenerator.error("There is nothing playing right now.")] });


        const track = queue.currentTrack;

        const embed = embedGenerator.info({
            title: "Now Playing",
            description:
                `${track.url ? `[${track.title}](${track.url})` : track.title}\n` +
                `Requested by: ${track.requestedBy?.displayName || "N/A"}`,
            thumbnail: { url: track.thumbnail },
            fields: [
                { name: "Author", value: track.author },
                { name: "Progress", value: timeline.timestamp?.progress ? `${timeline.timestamp.progress}%` : "0%" },
                { name: "Loop mode", value: getLoopMode(queue), inline: true },
                { name: "Play mode", value: getPauseMode(queue), inline: true },
                { name: "Extractor", value: `\`${track.extractor?.identifier || "N/A"}\`` },
            ],
            footer: { text: `Event Loop Lag: ${queue.player.eventLoopLag.toFixed(0)}ms` },
        }).withAuthor(track.requestedBy || message.author);

        const loopButton = new ButtonBuilder()
            .setCustomId("loop")
            .setLabel("🔁")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!queue.currentTrack);

        const backButton = new ButtonBuilder()
            .setCustomId("back")
            .setLabel("⏮")
            .setStyle(ButtonStyle.Success)
            .setDisabled(!history || !history.tracks.data.length);

        const playPauseButton = new ButtonBuilder()
            .setCustomId("playPause")
            .setLabel(timeline.paused ? "▶️" : "⏸️")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!queue.currentTrack);

        const nextButton = new ButtonBuilder()
            .setCustomId("next")
            .setLabel("⏭")
            .setStyle(ButtonStyle.Success)
            .setDisabled(!queue || !queue.tracks.data.length);

        const stopButton = new ButtonBuilder()
            .setCustomId("stop")
            .setLabel("⏹")
            .setStyle(ButtonStyle.Danger)
            .setDisabled(!queue || !queue.tracks.data.length);

        const shuffleButton = new ButtonBuilder()
            .setCustomId("shuffle")
            .setLabel("🔀")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(!queue || !queue.tracks.size < 2);

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId("selectTrack")
            .setPlaceholder("Select a track to jump to")
            .addOptions(
                // eslint-disable-next-line no-shadow
                queue.tracks.data.slice(0, 20).map((track, index) => ({
                    label: track.title.substring(0, 100),
                    description: track.author.substring(0, 100),
                    value: track.title.substring(0, 100),
                })),
            );

        const row = new ActionRowBuilder().addComponents(loopButton, backButton, playPauseButton, nextButton, stopButton, shuffleButton);
        const row2 = new ActionRowBuilder().addComponents(selectMenu);

        const sentMessage = await message.reply({ embeds: [embed], components: [row, row2] });

        const filter = (interaction) => interaction.user?.voice?.channel?.id === message.author?.voice?.channel?.id;
        const collector = sentMessage.createMessageComponentCollector({ filter, time: 60000 });

        collector.on("collect", async (interaction) => {
            if (!queue || !queue.currentTrack)
                return await interaction.update({ embeds: [embedGenerator.error("There is nothing playing right now.")], components: [] });


            try {
                switch (interaction.customId) {
                    case "loop":
                        queue.setRepeatMode(queue.repeatMode == QueueRepeatMode.OFF ? QueueRepeatMode.TRACK : QueueRepeatMode.OFF);
                        break;
                    case "back":
                        await history.previous();
                        break;
                    case "playPause":
                        timeline.paused ? timeline.resume() : timeline.pause();
                        break;
                    case "next":
                        queue.node.skip();
                        break;
                    case "stop":
                        queue.delete();
                        break;
                    case "shuffle":
                        queue.tracks.shuffle();
                        break;
                    case "selectTrack":
                        // eslint-disable-next-line no-shadow
                        queue.node.skipTo(queue.tracks.map(track => track.title).indexOf(interaction.values[0]));
                        break;
                }
            } catch (error) {
                logger.error(error);
            }

            await wait(500);

            const updatedTrack = queue.currentTrack;
            const updatedEmbed = embedGenerator.info({
                title: "Now Playing",
                description:
                    `${updatedTrack.url ? `[${updatedTrack.title}](${updatedTrack.url})` : updatedTrack.title}\n` +
                    `Requested by: ${updatedTrack.requestedBy?.displayName || "N/A"}`,
                thumbnail: { url: updatedTrack.thumbnail },
                fields: [
                    { name: "Author", value: updatedTrack.author },
                    { name: "Progress", value: timeline.timestamp?.progress ? `${timeline.timestamp.progress}%` : "0%" },
                    { name: "Loop mode", value: getLoopMode(queue), inline: true },
                    { name: "Play mode", value: getPauseMode(timeline), inline: true },
                    { name: "Extractor", value: `\`${updatedTrack.extractor?.identifier || "N/A"}\`` },
                ],
                footer: { text: `Event Loop Lag: ${queue.player.eventLoopLag.toFixed(0)}ms` },
            }).withAuthor(updatedTrack.requestedBy || message.author);

            loopButton.setDisabled(!queue.currentTrack);
            backButton.setDisabled(!history || !history.tracks.data.length);
            playPauseButton.setDisabled(!queue.currentTrack);
            playPauseButton.setLabel(timeline.paused ? "▶️" : "⏸️");
            nextButton.setDisabled(!queue || !queue.tracks.data.length);
            stopButton.setDisabled(!queue || !queue.tracks.data.length);
            shuffleButton.setDisabled(!queue || !queue.tracks.size < 2);

            await interaction.update({ embeds: [updatedEmbed], components: [row, row2] });
        });

        collector.on("end", async () => {
            const updatedTrack = queue.currentTrack;
            const updatedEmbed = embedGenerator.info({
                title: "Now Playing",
                description:
                    `${updatedTrack.url ? `[${updatedTrack.title}](${updatedTrack.url})` : updatedTrack.title}\n` +
                    `Requested by: ${updatedTrack.requestedBy?.displayName || "N/A"}`,
                thumbnail: { url: updatedTrack.thumbnail },
                fields: [
                    { name: "Author", value: updatedTrack.author },
                    { name: "Progress", value: timeline.timestamp?.progress ? `${timeline.timestamp.progress}%` : "0%" },
                    { name: "Loop mode", value: getLoopMode(queue), inline: true },
                    { name: "Play mode", value: getPauseMode(timeline), inline: true },
                    { name: "Extractor", value: `\`${updatedTrack.extractor?.identifier || "N/A"}\`` },
                ],
                footer: { text: `Event Loop Lag: ${queue.player.eventLoopLag.toFixed(0)}ms` },
            }).withAuthor(updatedTrack.requestedBy || message.author);

            playPauseButton.setLabel(timeline.paused ? "▶️" : "⏸️");
            row.components.forEach((component) => component.setDisabled(true));
            await sentMessage.edit({ embeds: [updatedEmbed], components: [row] });
        });

        collector.on("ignore", (interaction) => {
            interaction.reply({ embeds: [embedGenerator.warning("You are not in the same voice channel as me.")], ephemeral: true });
        });
    },
};