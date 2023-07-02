const { EmbedBuilder } = require("discord.js");
const SendErrorEmbed = require("../../../utils/functions/SendErrorEmbed");
const { useQueue, useTimeline } = require('discord-player');

module.exports = {
    name: "pause",
    description: "Pause currently playing music",
    category: "music",
    execute(logger, client, message, args) {
        if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow");

        const queue = useQueue(message.guild.id);
        const timeline = useTimeline(message.guild.id);

        if (!queue || !queue.currentTrack) return SendErrorEmbed(message, "There is nothing in the queue right now.", "yellow");

        timeline.paused ? timeline.resume() : timeline.pause();
        const state = timeline.paused;

        const music_resumed_embed = new EmbedBuilder()
            .setColor("#ffffff")
            .setDescription('Music resumed.')
            .setTimestamp();

        const music_paused_embed = new EmbedBuilder()
            .setColor("#ffffff")
            .setDescription('Music paused.')
            .setTimestamp();

        message.reply({ embeds: [state ? music_paused_embed : music_resumed_embed] });
    }
}; 
