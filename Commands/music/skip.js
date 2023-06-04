const { EmbedBuilder } = require("discord.js");
const SendErrorEmbed = require("../../utils/functions/SendErrorEmbed");
const { useQueue } = require('discord-player');

module.exports = {
    name: "skip",
    description: "Skip a currently playing song",
    category: "music",
    execute(logger, client, message, args) {
        if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow");

        const queue = useQueue(message.guild.id);
        if (!queue || !queue.currentTrack) SendErrorEmbed(message, "There is nothing in the queue.", "yellow");

        try {
            queue.node.skip();
            const skipped_embed = new EmbedBuilder()
                .setColor("#ffffff")
                .setDescription(`Skipped!`)
                .setTimestamp();
            message.reply({ embeds: [skipped_embed], allowedMentions: { repliedUser: false } });
        } catch (e) {
            SendErrorEmbed(message, "An error occurred.", "red", e);
        }
    }
}; 