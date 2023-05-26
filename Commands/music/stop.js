const { EmbedBuilder } = require("discord.js")
const SendErrorEmbed = require("../../utils/functions/SendErrorEmbed")
module.exports = {
    name: "stop",
    description: "Stop currently playing music",
    category: "music",
    execute(logger, client, message) {
        const queue = client.distube.getQueue(message)
        if (!queue) return SendErrorEmbed(message, "There is nothing in the queue.", "yellow")

        queue.stop()
        const stoppped_music_embed = new EmbedBuilder()
            .setColor("#ffffff")
            .setDescription("Stopped!")
            .setTimestamp()
        message.channel.send({ embeds: [stoppped_music_embed] })
    }
}