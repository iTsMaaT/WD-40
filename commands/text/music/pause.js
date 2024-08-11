const { EmbedBuilder } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue, useTimeline, useMainPlayer } = require("discord-player");
const { getPauseMode } = require("@utils/helpers/playerHelpers");

module.exports = {
    name: "pause",
    description: "Pauses / Resumes currently playing music",
    category: "music",
    async execute(logger, client, message, args, optionalArgs) {
        if (!message.member.voice.channel) return await message.reply({ embeds: [embedGenerator.warning("You must be in a voice channel.")] });

        const queue = useQueue(message.guild.id);
        const timeline = useTimeline(message.guild.id);

        if (!queue || !queue.currentTrack) return await message.reply({ embeds: [embedGenerator.error("There is nothing in the queue right now.")] });

        timeline.paused ? timeline.resume() : timeline.pause();

        const embed = embedGenerator.info({
            title: getPauseMode(timeline),
        }).withAuthor(message.author);

        await message.reply({ embeds: [embed] });
    },
}; 
