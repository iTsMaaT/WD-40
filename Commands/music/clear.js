const { EmbedBuilder } = require("discord.js")
const SendErrorEmbed = require("../../utils/functions/SendErrorEmbed")
module.exports = {
    name: "clear",
    description: "Clear currently playing queue",
    category: "music",
    execute(logger, client, message, args) {
        const queue = player.getQueue(message.guild.id)
        if (!queue || !queue.playing) return SendErrorEmbed(message, "There is nothing in the queue.", "yellow")

        queue.clear()
        const stoppped_music_embed = new EmbedBuilder()
            .setColor("#ffffff")
            .setDescription("Cleared!")
            .setTimestamp()
        message.channel.send({ embeds: [stoppped_music_embed] })
    }
}