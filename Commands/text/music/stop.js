const { EmbedBuilder } = require("discord.js");
const SendErrorEmbed = require("../../../utils/functions/SendErrorEmbed");
const { useQueue } = require('discord-player');

module.exports = {
    name: "stop",
    description: "Stop currently playing queue",
    category: "music",
    execute(logger, client, message, args) {
        const queue = useQueue(message.guild.id);
        if (!queue) return SendErrorEmbed(message, "There is nothing in the queue.", "yellow");

        queue.delete();
        const stoppped_music_embed = new EmbedBuilder()
            .setColor("#ffffff")
            .setDescription("Stopped!")
            .setTimestamp();
        message.reply({ embeds: [stoppped_music_embed], allowedMentions: { repliedUser: false } });
    }
};