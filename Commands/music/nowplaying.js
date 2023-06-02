const {EmbedBuilder} = require("discord.js")
const SendErrorEmbed = require("../../utils/functions/SendErrorEmbed")
module.exports={
    name:"nowplaying",
    description:"See what song is currently playing",
    category: "music",
    execute(logger, client, message, args){
        const queue = player.getQueue(message.guild.id)
        if (!queue) return SendErrorEmbed(message, "There is nothing in the queue right now.", "yellow")

        const track = queue.current;
        const trackDuration = timestamp.progress == 'Infinity' ? 'infinity (live)' : track.duration;
        const timestamp = queue.getPlayerTimestamp();


        const song_playing_embed = new EmbedBuilder()
        .setColor("#ffffff")
        .setDescription(`I'm playing **\`${track}\`**, Duration: ${timestamp} / ${trackDuration}`)
        .setTimestamp()
        message.channel.send({embeds:[song_playing_embed]})
    }
}