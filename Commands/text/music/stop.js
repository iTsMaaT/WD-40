const { EmbedBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    name: "stop",
    description: "Stop currently playing queue",
    category: "music",
    execute(logger, client, message, args) {
        const queue = useQueue(message.guild.id);
        if (!queue) return message.guild.me.voice.setChannel(null).catch(() => null);

        queue.delete();
        const stoppped_music_embed = new EmbedBuilder()
            .setColor("#ffffff")
            .setDescription("Stopped!")
            .setTimestamp();
        message.reply({ embeds: [stoppped_music_embed] });
    },
};