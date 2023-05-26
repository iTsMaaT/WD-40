const { EmbedBuilder } = require("discord.js")
const SendErrorEmbed = require("../../utils/functions/SendErrorEmbed")
module.exports = {
  name: "leave",
  description: "Make the bot leave the VC",
  category: "music",
  execute(logger, client, message, args) {
    if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow")

    const queue = client.distube.getQueue(message)
    if (queue) queue.stop()
    client.distube.voices.leave(message)
    const leave_embed = new EmbedBuilder()
      .setColor("#ffffff")
      .setDescription(`Left the channel!`)
      .setTimestamp()
    return message.channel.send({ embeds: [leave_embed] })
  }
}
