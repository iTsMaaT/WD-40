const { EmbedBuilder } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { QueueRepeatMode, useQueue, useMainPlayer } = require("discord-player");
const { getLoopMode } = require("@utils/helpers/playerHelpers");

module.exports = {
    name: "loop",
    description: "Loop a desired song or queue",
    usage: {
        required: {
            name: "loop type",
            description: "The type of loop to set (Off, Song, Queue or Autoplay)",
        },
    },
    category: "music",
    examples: ["track"],
    inVoiceChannel: true,
    inSameVoiceChannel: true,
    async execute(logger, client, message, args, flags) {
        const queue = useQueue();
        const loopMode = args[0]?.toLowerCase() || "queue";

        if (!queue || !queue.tracks) return await message.reply({ embeds: [embedGenerator.error("There is nothing playing.")] });
        
        let newLoopMode;
        const oldLoopMode = queue.repeatMode;

        switch (loopMode) {
            case "off":
                newLoopMode = QueueRepeatMode.OFF;
                break;
            case "song":
            case "track":
                newLoopMode = QueueRepeatMode.TRACK;
                break;
            case "queue":
                newLoopMode = QueueRepeatMode.QUEUE;
                break;
            case "autoplay":
                newLoopMode = QueueRepeatMode.AUTOPLAY;
                break;
            default:
                return await message.reply({ embeds: [embedGenerator.warning("Invalid loop type. (Needs to be: off, queue, song or autoplay)")] });
        }
        
        if (oldLoopMode === newLoopMode) newLoopMode = QueueRepeatMode.OFF;
        queue.setRepeatMode(newLoopMode);

        await message.reply({ embeds: [embedGenerator.info(`Loop mode set from [\`${getLoopMode({ repeatMode: oldLoopMode })}\`] to [\`${getLoopMode({ repeatMode: newLoopMode })}\`]`)] });
    },
}; 
