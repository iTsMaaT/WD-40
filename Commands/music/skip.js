const { EmbedBuilder } = require("discord.js")
module.exports={
    name:"skip",
    description:"Skip a currently playing song",
    category: "music",
    execute(logger, client, message, args){
      if (!message.member.voice.channel) {
        const must_be_in_vc_embed = new EmbedBuilder()
      .setColor("#FF0000")
      .setDescription(`You must be in a voice channel!`)
      .setTimestamp()
        return message.channel.send({embeds:[must_be_in_vc_embed]})
      }
        const queue = client.distube.getQueue(message)
        const nothing_playing_embed =  new EmbedBuilder()
        .setColor("#FF0000")
        .setDescription(`There is nothing in the queue right now!`)
        .setTimestamp()
    if (!queue) return message.channel.send({embeds:[nothing_playing_embed]})
    try {
      const song = queue.skip()
      const skipped_embed =  new EmbedBuilder()
      .setColor("#FF0000")
      .setDescription(`Skipped!`)
      .setTimestamp()
      message.channel.send({embeds:[skipped_embed]})
    } catch (e) {
        const error_embed =  new EmbedBuilder()
        .setColor("#FF0000")
        .setDescription(`an error occurred \n  ${e}`)
        .setTimestamp() 
      message.channel.send({embeds:[error_embed]})
    }
    }
} 