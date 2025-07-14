const { QueryType, useQueue } = require("discord-player");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "seek",
    description: "Seek to a specific time in the current track.",
    usage: {
        required: {
            "seconds": "time in seconds to seek to",
        },
    },
    category: "music",
    examples: ["60"],
    cooldown: 1000,
    inVoiceChannel: true,
    inSameVoiceChannel: true,
    private: true,
    async execute(logger, client, message, args) {
        const queue = useQueue();

        if (!queue || !queue.node.isPlaying()) 
            return await message.reply({ embeds: [embedGenerator.warning("No music is currently playing.")] });
        

        const seekTime = parseInt(args[0], 10);
        const durationSec = Math.floor(queue.currentTrack.durationMS / 1000);

        if (isNaN(seekTime) || seekTime < 0 || seekTime > durationSec) 
            return await message.reply({ embeds: [embedGenerator.warning(`Please provide a valid time in seconds (0-${durationSec}).`)] });
        

        const sentMessage = await message.reply({ embeds: [embedGenerator.info({ description: `Seeking to ${seekTime} seconds...` })] });

        try {
            await queue.node.seek(seekTime * 1000);
            await sentMessage.edit({ embeds: [embedGenerator.success(`Seeked to ${seekTime} seconds in the current track.`)] });
        } catch (err) {
            logger?.error?.(err);
            await sentMessage.edit({ embeds: [embedGenerator.error("Failed to seek in the current track.")] });
        }
    },
};