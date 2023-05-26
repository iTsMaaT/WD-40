const {EmbedBuilder} = require("discord.js")
const SendErrorEmbed = require("../../utils/functions/SendErrorEmbed")
module.exports={
    name:"nowplaying",
    description:"See what song is currently playing",
    category: "music",
    execute(logger, client, message, args){
        const queue = client.distube.getQueue(message)
        if (!queue) return SendErrorEmbed(message, "There is nothing in the queue right now.", "yellow")

        const song = queue.songs[0]
        const song_playing_embed = new EmbedBuilder()
        .setColor("#ffffff")
        .setDescription(`I'm playing **\`${song.name}\`**, by ${song.user}`)
        .setTimestamp()
        message.channel.send({embeds:[song_playing_embed]})
    }
}