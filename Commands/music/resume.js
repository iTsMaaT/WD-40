const {EmbedBuilder} = require("discord.js")
const SendErrorEmbed = require("../../utils/functions/SendErrorEmbed")
module.exports={
    name:"resume",
    description:"Resume a paused song",
    category: "music",
    execute(logger, client, message, args){
      if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow")

        const queue = client.distube.getQueue(message)
    if (!queue) return SendErrorEmbed(message, "There is nothing in the queue right now.", "yellow")
    
    if (queue.paused) {
      queue.resume()
      const music_resumed_embed = new EmbedBuilder()
        .setColor("#ffffff")
        .setDescription("Music resumed :)")
        .setTimestamp()
      message.channel.send({embeds:[music_resumed_embed]})
    } else {
      const music_not_paused_embed = new EmbedBuilder()
        .setColor("#ffffff")
        .setDescription('The queue is not paused!')
        .setTimestamp()
      message.channel.send({embeds:[music_not_paused_embed]})
    }
    }
} 
