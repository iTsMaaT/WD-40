const {EmbedBuilder} = require("discord.js")
module.exports={
    name:"seek",
    description:"Fast forward music",
    execute(logger, client, message, args){
      if (!message.member.voice.channel) {
        const must_be_in_vc_embed = new EmbedBuilder()
      .setColor("#FF0000")
      .setDescription(`You must be in a voice channel!`)
      .setTimestamp()
        return message.channel.send({embeds:[must_be_in_vc_embed]})
      }
        const queue = client.distube.getQueue(message)
        const no_queue_embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setDescription(`There is nothing in the queue right now!`)
        .setTimestamp()
    if (!queue) return message.channel.send({embeds:[no_queue_embed]})
    if (!args[0]) {
      const no_valid_position_embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setDescription(`Please provide position (in seconds) to seek!`)
        .setTimestamp()
      return message.channel.send({embeds:[no_valid_position_embed]})
    }
    const time = Number(args[0])
    const no_valid_number_embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setDescription(`Please enter a valid number!`)
        .setTimestamp()
    if (isNaN(time)) return message.channel.send({embeds:[no_valid_number_embed]})
    queue.seek(time)
    const no_music_embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setDescription(`Seeked to ${time}!`)
        .setTimestamp()
    message.channel.send({embeds:[no_music_embed]})
    }
} 