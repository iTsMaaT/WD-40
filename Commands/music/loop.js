const { EmbedBuilder } = require("discord.js")
const SendErrorEmbed = require("../../utils/functions/SendErrorEmbed")
const {  QueueRepeatMode, useQueue } = require('discord-player');

module.exports = {
  name: "loop",
  description: "Loop a desired song or queue",
  usage: "< [loop type] : Off, Song or Queue >",
  category: "music",
  execute(logger, client, message, args) {
    if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow")

    const queue = useQueue(message.guild.id)

    if (!queue || !queue.tracks) return SendErrorEmbed(message, "There is nothing playing.", "yellow")
    switch (args[0]) {
      case 'off':
        queue.setRepeatMode(QueueRepeatMode.TRACK)
        break
      case 'song':
        queue.setRepeatMode(QueueRepeatMode.OFF)
        break
      case 'queue':
        queue.setRepeatMode(QueueRepeatMode.QUEUE);
        break
      default:
        SendErrorEmbed(message, "Invalid loop type.", "yellow")
    }
    
    const repeat_mode_embed = new EmbedBuilder()
      .setColor("#ffffff")
      .setDescription(`Set repeat mode to \`${args[0]}\``)
      .setTimestamp()
      message.reply({ embeds: [repeat_mode_embed], allowedMentions: { repliedUser: false }})
  }
} 
