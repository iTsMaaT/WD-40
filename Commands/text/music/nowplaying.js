const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue, useTimeline, useMainPlayer } = require("discord-player");

module.exports = {
    name: "nowplaying",
    description: "See what song is currently playing",
    category: "music",
    aliases: ["np"],
    async execute(logger, client, message, args, optionalArgs) {
        const queue = useQueue(message.guild.id);
        const timeline = useTimeline(message.guild.id);

        if (!queue || !queue.currentTrack) return await message.reply({ embeds: [embedGenerator.error("There is nothing in the queue right now.")] });

        const track = queue.currentTrack;

        const embed = embedGenerator.info({
            title: "Now Playing",
            description: `[${track.title}](${track.url})`,
            fields: [
                { name: "Author", value: track.author },
                { name: "Progress", value: track.isLive ? "Live ┃ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬🔘 ┃ Infinity (99%)" : `${queue.node.createProgressBar()} (${timeline.timestamp?.progress}%)` },    
                { name: "Extractor", value: `\`${track.extractor?.identifier || "N/A"}\`` },
            ],
            footer: { text: `Event Loop Lag: ${queue.player.eventLoopLag.toFixed(0)}ms` },
        }).withAuthor(message.author);

        await message.reply({ embeds: [embed] });
    },
};