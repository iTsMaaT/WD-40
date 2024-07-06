const { EmbedBuilder } = require("discord.js");
const { SendErrorEmbed } = require("@functions/discordFunctions");
const { useQueue, useMainPlayer } = require("discord-player");

module.exports = {
    name: "clear",
    description: "Clear currently playing queue",
    category: "music",
    execute(logger, client, message, args, optionalArgs) {
        const queue = useQueue(message.guild.id);
        if (!queue) return SendErrorEmbed(message, "There is nothing in the queue.", "yellow");

        queue.tracks.clear();
        const stoppped_music_embed = new EmbedBuilder()
            .setColor("#ffffff")
            .setDescription("Cleared!")
            .setTimestamp();
        message.reply({ embeds: [stoppped_music_embed] });
    },
};