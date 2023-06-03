const { EmbedBuilder } = require("discord.js")
const { useQueue } = require('discord-player');

module.exports = {
  name: "queue",
  description: "Shows the current queue for songs",
  usage: "< [Page]: page to go to (optional) >",
  category: "music",
  execute(logger, client, message, args) {
    const queue = useQueue(message.guild.id)
    if (!queue || !queue.tracks || !queue.currentTrack) return SendErrorEmbed(message, "There is nothing in the queue / currently playing.", "yellow")

    const songs = queue.tracks.size;
    const nextSongs = songs > 10 ? `And **${songs - 10}** other song(s)...` : `In the playlist **${songs}** song(s)...`;
    const tracks = queue.tracks.map((track, i) => `**${i + 1}** - ${track.title} | ${track.author} (requested by : ${track.requestedBy.username})`)


    const embed = new EmbedBuilder()
        .setColor('#ffffff')
        .setAuthor({name: `Server queue - ${message.guild.name}`})
        .setDescription(`**Current:** ${queue.currentTrack.title}\n\n${tracks.slice(0, 10).join('\n')}\n\n${nextSongs}`)
        .setTimestamp()
        message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
  }
}
