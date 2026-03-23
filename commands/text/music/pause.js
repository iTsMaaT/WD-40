const { EmbedBuilder } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue, useTimeline, useMainPlayer } = require("discord-player");
const { getPauseMode } = require("@root/utils/helpers/player/playerHelpers");

module.exports = {
    name: "pause",
    description: "Pauses / Resumes currently playing music",
    category: "music",
    inVoiceChannel: true,
    inSameVoiceChannel: true,
    async execute(logger, client, message, args, flags) {
        const queue = useQueue();
        const timeline = useTimeline();

        if (!queue || !queue.currentTrack) return await message.reply({ embeds: [embedGenerator.error("There is nothing in the queue right now.")] });

        timeline.paused ? timeline.resume() : timeline.pause();

        const embed = embedGenerator.info({
            title: getPauseMode(timeline),
        }).withAuthor(message.author);

        await message.reply({ embeds: [embed] });
    },
}; 
