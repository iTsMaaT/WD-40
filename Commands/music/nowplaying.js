const { EmbedBuilder } = require("discord.js")
const SendErrorEmbed = require("../../utils/functions/SendErrorEmbed")
const { useQueue, useTimeline } = require('discord-player');

module.exports = {
    name: "nowplaying",
    description: "See what song is currently playing",
    category: "music",
    execute(logger, client, message, args) {
        const queue = useQueue(message.guild.id)
        const timeline = useTimeline(message.guild.id);

        if (!queue || !queue.currentTrack) return SendErrorEmbed(message, "There is nothing in the queue right now.", "yellow")

        const track = queue.currentTrack;

        const song_playing_embed = new EmbedBuilder()
            .setColor(0xffffff)
            .setTitle('Now Playing')
            .setDescription(`[${track.title}](${track.url})`)
            .addFields([
                { name: 'Author', value: track.author },
                { name: 'Progress', value: `${queue.node.createProgressBar()} (${timeline.timestamp?.progress}%)` },
                { name: 'Extractor', value: `\`${track.extractor?.identifier || 'N/A'}\`` }
            ])
            .setFooter({
                text: `Ping: ${queue.ping}ms | Event Loop Lag: ${queue.player.eventLoopLag.toFixed(0)}ms`
            });
        message.reply({ embeds: [song_playing_embed], allowedMentions: { repliedUser: false }})
    }
}