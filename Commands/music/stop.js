const {EmbedBuilder} = require("discord.js")
module.exports={
    name:"stop",
    description:"Stop currently playing music",
    execute(logger, client, message){
        const queue = client.distube.getQueue(message)
        const no_music_embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setDescription(`There is nothing in the queue right now!`)
        .setTimestamp()
    if (!queue) return message.channel.send({embeds:[no_music_embed]})
    queue.stop()
    const stoppped_music_embed =  new EmbedBuilder()
    .setColor("#FF0000")
    .setDescription("Stopped!")
    .setTimestamp()
    message.channel.send({embeds:[stoppped_music_embed]})
    }
}
 