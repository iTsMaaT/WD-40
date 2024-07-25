const { EmbedBuilder } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue, useMainPlayer } = require("discord-player");

module.exports = {
    name: "clear",
    description: "Clear currently playing queue",
    category: "music",
    async execute(logger, client, message, args, optionalArgs) {
        const queue = useQueue(message.guild.id);
        if (!queue) return await message.reply({ embeds: [embedGenerator.error("There is no queue to clear.")] });

        queue.tracks.clear();

        const stoppped_music_embed = embedGenerator.info({
            title: "Cleared!",
            description: "Cleared the queue.",
        }).withAuthor(message.author);

        message.reply({ embeds: [stoppped_music_embed] });
    },
};