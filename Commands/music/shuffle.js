module.exports = {
  name: 'shuffle',
  description: "Shuffles the playlist",
  category: "music",
  inVoiceChannel: true,
  execute: async (logger, client, message, args) => {
    const queue = player.getQueue(message.guild.id)
    if (!queue) return SendErrorEmbed(message, "There is nothing in the queue.", "yellow")
    if (!queue.tracks[0]) return SendErrorEmbed(message, "There is nothing up next.", "yellow")
    queue.shuffle()

    shuffle_embed = {
      color: 0xffffff,
      title: `Queue shuffled`,
      description: `Shuffled ${queue.tracks.length} songs.`,
      timestamp: new Date(),
    }

    message.reply({ embeds: [shuffle], allowedMentions: { repliedUser: false } });
  }
}