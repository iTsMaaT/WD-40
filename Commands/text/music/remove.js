const { useQueue } = require('discord-player');
const { SendErrorEmbed } = require("@functions/discordFunctions");
const { EmbedBuilder } = require("discord.js");

module.exports = {
    name: "remove",
    description: "Removes a given track",
    usage: "< [Track]: track to remove >",
    category: "music",
    execute(logger, client, message, args) {
        const queue = useQueue(message.guild.id);

        if (!queue || !queue.tracks || !queue.currentTrack) return SendErrorEmbed(message, "There is nothing in the queue / currently playing.", "yellow");

        const remove = parseInt(args[0]);
        const trackResolvable = queue.tracks.at(remove);

        if (isNaN(remove) || !trackResolvable) return SendErrorEmbed(message, `Couldn't find song to skip to.`, "red");

        queue.node.remove(trackResolvable);

        const embed = new EmbedBuilder()
            .setColor('#ffffff')
            .setDescription(`Removed: ${trackResolvable.title}`)
            .setTimestamp();
        message.reply({ embeds: [embed] });
    }
};