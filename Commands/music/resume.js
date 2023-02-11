const {EmbedBuilder} = require("discord.js")
module.exports={
    name:"resume",
    description:"Resume a paused song",
    execute(logger, client, message, args){
      if (!message.member.voice.channel) {
        const must_be_in_vc_embed = new EmbedBuilder()
      .setColor("#FF0000")
      .setDescription(`You must be in a voice channel!`)
      .setTimestamp()
        return message.channel.send({embeds:[must_be_in_vc_embed]})
      }
        const queue = client.distube.getQueue(message)
        const no_music_embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setDescription(`There is nothing in the queue right now!`)
        .setTimestamp()
    if (!queue) return message.channel.send({embeds:[no_music_embed]})
    if (queue.paused) {
      queue.resume()
      const music_resumed_embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setDescription("Music resumed :)")
        .setTimestamp()
      message.channel.send({embeds:[music_resumed_embed]})
    } else {
      const music_not_paused_embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setDescription('The queue is not paused!')
        .setTimestamp()
      message.channel.send({embeds:[music_not_paused_embed]})
    }
    }
} 
