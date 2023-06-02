const { EmbedBuilder } = require("discord.js")
const SendErrorEmbed = require("../../utils/functions/SendErrorEmbed")
module.exports = {
  name: "skip",
  description: "Skip a currently playing song",
  category: "music",
  execute(logger, client, message, args) {
    if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow")

    const queue = player.getQueue(message.guild.id)
    if (!queue) SendErrorEmbed(message, "There is nothing in the queue.", "yellow")
    
    try {
      queue.skip()
      const skipped_embed = new EmbedBuilder()
        .setColor("#ffffff")
        .setDescription(`Skipped!`)
        .setTimestamp()
      message.channel.send({ embeds: [skipped_embed] })
    } catch (e) {
      SendErrorEmbed(message, "An error occurred.", "red", e)
    }
  }
} 