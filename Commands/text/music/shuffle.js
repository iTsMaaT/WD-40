const { useQueue } = require('discord-player');
const SendErrorEmbed = require('../../../utils/functions/SendErrorEmbed');

module.exports = {
    name: 'shuffle',
    description: "Shuffles the playlist",
    category: "music",
    inVoiceChannel: true,
    execute: async (logger, client, message, args) => {
        const queue = useQueue(message.guild.id);
        if (!queue) return SendErrorEmbed(message, "There is nothing in the queue.", "yellow");
        if (queue.tracks.size < 2) return SendErrorEmbed(message, "There is not enough tracks to shuffle.", "yellow");
        queue.tracks.shuffle();

        const shuffle_embed = {
            color: 0xffffff,
            title: `Queue shuffled`,
            description: `Shuffled ${queue.tracks.size} songs.`,
            timestamp: new Date(),
        };

        message.reply({ embeds: [shuffle_embed], allowedMentions: { repliedUser: false } });
    }
};