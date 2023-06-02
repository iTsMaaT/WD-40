const { EmbedBuilder } = require("discord.js")
const SendErrorEmbed = require("../../utils/functions/SendErrorEmbed")
module.exports = {
  name: "pause",
  description: "Pause currently playing music",
  category: "music",
  execute(logger, client, message, args) {
    if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow")

    const queue = player.getQueue(message.guild.id)
    if (!queue) return SendErrorEmbed(message, "There is nothing in the queue right now.", "yellow")

    if (queue.connection.paused) {
      queue.setPaused(false)
      const music_resumed_embed = new EmbedBuilder()
        .setColor("#ffffff")
        .setDescription('Music resumed :)')
        .setTimestamp()
      return message.channel.send({ embeds: [music_resumed_embed] })
    }
    queue.setPaused(true)
    const music_paused_embed = new EmbedBuilder()
      .setColor("#ffffff")
      .setDescription('Music paused :)')
      .setTimestamp()
    message.channel.send({ embeds: [music_paused_embed] })
  }
} 
