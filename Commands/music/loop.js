const { EmbedBuilder } = require("discord.js")
const SendErrorEmbed = require("../../utils/functions/SendErrorEmbed")
module.exports = {
  name: "loop",
  description: "Loop a desired song or queue",
  category: "music",
  execute(logger, client, message, args) {
    if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow")

    const queue = client.distube.getQueue(message)
    if (!queue) return SendErrorEmbed(message, "There is nothing playing.", "yellow")
    let mode = 1
    switch (args[0]) {
      case 'off':
        mode = 0
        break
      case 'song':
        mode = 1
        break
      case 'queue':
        mode = 2
        break
    }
    mode = queue.setRepeatMode(mode)
    mode = mode ? (mode === 2 ? 'Repeat queue' : 'Repeat song') : 'Off'
    const repeat_mode_embed = new EmbedBuilder()
      .setColor("#ffffff")
      .setDescription(`Set repeat mode to \`${mode}\``)
      .setTimestamp()
    message.channel.send({ embeds: [repeat_mode_embed] })
  }
} 
