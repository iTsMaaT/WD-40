const { EmbedBuilder } = require("discord.js")
const fs = require('fs');
module.exports = {
  name: "queue",
  description: "Shows the current queue for songs",
  usage: "< [Page]: page to go to (optional) >",
  category: "music",
  execute(logger, client, message, args) {
    const queue = player.getQueue(message.guild.id)
    if (!queue) return SendErrorEmbed(message, "There is nothing in the queue right now.", "yellow")
    if (!queue.tracks[0]) return SendErrorEmbed(message, "There is no music up next.", "yellow")

    const songs = queue.tracks.length;
    const nextSongs = songs > 5 ? `And **${songs - 5}** other song(s)...` : `In the playlist **${songs}** song(s)...`;
    const tracks = queue.tracks.map((track, i) => `**${i + 1}** - ${track.title} | ${track.author} (requested by : ${track.requestedBy.username})`)


    const embed = new EmbedBuilder()
        .setColor('#ffffff')
        .setAuthor({name: `Server queue - ${message.guild.name}`})
        .setDescription(`Current ${queue.current.title}\n\n${tracks.slice(0, 5).join('\n')}\n\n${nextSongs}`)
        .setTimestamp()
        message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
  }
}
