const {EmbedBuilder} = require("discord.js")
module.exports={
    name:"loop",
    description:"Loop a desired song",
    category: "music",
    execute(client, message, args){
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
        .setDescription(`There is nothing playing!`)
        .setTimestamp()
    if (!queue) return message.channel.send({embeds:[no_music_embed]})
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
        .setColor("#FF0000")
        .setDescription(`Set repeat mode to \`${mode}\``)
        .setTimestamp()
    message.channel.send({embeds:[repeat_mode_embed]})
    }
} 
