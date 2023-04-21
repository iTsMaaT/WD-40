module.exports={
    name:"leave",
    description:"Make the bot leave the VC",
    category: "music",
    execute(logger, client, message, args){
        if (!message.member.voice.channel) {
            const must_be_in_vc_embed = new EmbedBuilder()
          .setColor("#FF0000")
          .setDescription(`You must be in a voice channel!`)
          .setTimestamp()
            return message.channel.send({embeds:[must_be_in_vc_embed]})
          }
        client.distube.voices.leave(message)
        const leave_embed = new EmbedBuilder()
          .setColor("#FF0000")
          .setDescription(`Left the channel!`)
          .setTimestamp()
            return message.channel.send({embeds:[leave_embed]})
    }
}
