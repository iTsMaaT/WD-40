const { EmbedBuilder } = require("discord.js")
const SendErrorEmbed = require("../../utils/functions/SendErrorEmbed")
module.exports = {
  name: "seek",
  description: "Fast forward music",
  category: "music",
  execute(logger, client, message, args) {
    if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow")

    const queue = client.distube.getQueue(message)
    if (!queue) return SendErrorEmbed(message, "There is nothing in the queue.", "yellow")

    if (!args[0]) return SendErrorEmbed(message, "Please provide position (in seconds) to seek.", "yellow")

    const time = Number(args[0])
    if (isNaN(time)) return SendErrorEmbed(message, "Please enter a valid number.", "yellow")
    
    queue.seek(time)
    const no_music_embed = new EmbedBuilder()
      .setColor("#ffffff")
      .setDescription(`Seeked to ${time}!`)
      .setTimestamp()
    message.channel.send({ embeds: [no_music_embed] })
  }
} 