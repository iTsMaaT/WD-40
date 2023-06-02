const { EmbedBuilder } = require("discord.js")
const SendErrorEmbed = require("../../utils/functions/SendErrorEmbed")
module.exports = {
    name: "volume",
    description: "Adjust the volume of the music",
    usage: "< [Volume] >",
    category: "music",
    execute(logger, client, message, args) {

        if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow")

        const queue = player.getQueue(message.guild.id)
        if (!queue) return SendErrorEmbed(message, "There is nothing in the queue.", "yellow")

        const volume = parseInt(args[0])
        if (isNaN(volume)) return SendErrorEmbed(message, "Invalid number (Please use 0 to 100 (Higher is possible but not recommended)).", "yellow")
        if (volume >= 151) return SendErrorEmbed(message, "Volume too high", "yellow")

        queue.setVolume(volume);
        const volume_set_embed = new EmbedBuilder()
            .setColor('#ffffff')
            .setDescription(`Volume set to \`${volume}\``)
            .setTimestamp()
        message.channel.send({ embeds: [volume_set_embed] })
    }
}
