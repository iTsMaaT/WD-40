const {EmbedBuilder} = require("discord.js")
module.exports={
    name:"pause",
    description:"Pause currently playing music",
    category: "music",
    execute(logger, client, message, args){
      if (!message.member.voice.channel) {
        const must_be_in_vc_embed = new EmbedBuilder()
      .setColor("#ffff00")
      .setDescription(`You must be in a voice channel!`)
      .setTimestamp()
        return message.channel.send({embeds:[must_be_in_vc_embed]})
      }
        const queue = client.distube.getQueue(message)
        const no_music_embed = new EmbedBuilder()
        .setColor("#ffff00")
        .setDescription(`There is nothing in the queue right now!`)
        .setTimestamp()
    if (!queue) return message.channel.send({embeds:[no_music_embed]})
    if (queue.paused) {
      queue.resume()
      const music_resumed_embed = new EmbedBuilder()
        .setColor("#ffffff")
        .setDescription('Music resumed :)')
        .setTimestamp()
      return message.channel.send({embeds:[music_resumed_embed]})
    }
    queue.pause()
    const music_paused_embed = new EmbedBuilder()
        .setColor("#ffffff")
        .setDescription('Music paused :)')
        .setTimestamp()
    message.channel.send({embeds:[music_paused_embed]})
    }
} 
