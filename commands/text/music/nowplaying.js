const embedGenerator = require("@utils/helpers/embedGenerator");
const { getLoopMode, getPauseMode } = require("@root/utils/helpers/player/playerHelpers");
const { useQueue, useTimeline, useMainPlayer } = require("discord-player");
const isURL = require("@utils/functions/isURL");

module.exports = {
    name: "nowplaying",
    description: "See what song is currently playing",
    category: "music",
    aliases: ["np", "playing"],
    async execute(logger, client, message, args, flags) {
        const queue = useQueue();
        const timeline = useTimeline();

        if (!queue || !queue.currentTrack) return await message.reply({ embeds: [embedGenerator.error("There is nothing in the queue right now.")] });

        const track = queue.currentTrack;

        const embed = embedGenerator.info({
            title: "Now Playing",
            description: 
                `${isURL(track.url) ? `[${track.title}](${track.url})` : track.title}\n` +
                `Requested by: ${track.requestedBy?.displayName || "N/A"}`,
            thumbnail: { url: track.thumbnail },
            fields: [
                { name: "Author", value: track.author },
                { name: "Progress", value: track.raw?.live ? "Live ┃ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔘 ┃ Infinity (99%)" : `${queue.node.createProgressBar()} (${timeline.timestamp?.progress}%)` }, 
                { name: "Loop mode", value: getLoopMode(queue), inline: true },
                { name: "Play mode", value: getPauseMode(queue), inline: true },
                { name: "Extractor", value: `\`${track.extractor?.identifier || "N/A"}\`` },
            ],
            footer: { text: `Event Loop Lag: ${queue.player.eventLoopLag.toFixed(0)}ms` },
        }).withAuthor(track.requestedBy || message.author);

        await message.reply({ embeds: [embed] });
    },
};