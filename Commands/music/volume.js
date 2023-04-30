const {EmbedBuilder} = require("discord.js")
module.exports={
    name:"volume",
    description:"Adjust the volume of the music",
    category: "music",
    execute(logger, client, message, args){
            
        if (!message.member.voice.channel) {
            const must_be_in_vc_embed = new EmbedBuilder()
          .setColor('#FF0000')
          .setDescription(`You must be in a voice channel!`)
          .setTimestamp()
            return message.channel.send({embeds:[must_be_in_vc_embed]})
          }
        const queue = client.distube.getQueue(message)
        const no_music_embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`There is nothing in the queue right now!`)
        .setTimestamp()
    if (!queue) return message.channel.send({embeds:[no_music_embed]})
    const volume = parseInt(args[0])
        const volume_too_high = new EmbedBuilder()
        .setColor("#FF0000")
        .setDescription("Volume too high!")
        .setTimestamp()
    const no_valid_number_embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`Please enter a valid number! (0-100. You can go above 100, but it's not recommended as the audio will start to tear)`)
        .setTimestamp()
    if (isNaN(volume)) return message.channel.send({embeds:[no_valid_number_embed]})
    if (volume >= 151) return message.channel.send({embeds:[volume_too_high]})
    queue.setVolume(volume)
    const volume_set_embed = new EmbedBuilder()
        .setColor('#FF0000')
        .setDescription(`Volume set to \`${volume}\``)
        .setTimestamp()
    message.channel.send({embeds:[volume_set_embed]})
    }
}
