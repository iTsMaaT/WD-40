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
    async execute(logger, client, message, args, optionalArgs) {
        if (!message.member.voice.channel) return await message.reply({ embeds: [embedGenerator.error("You must be in a voice channel.")] });
        
        const queue = useQueue();
        const loopMode = args[0]?.toLowerCase() || "queue";

        let newLoopMode;
        const oldLoopMode = queue.repeatMode;

        if (!queue || !queue.tracks) return await message.reply({ embeds: [embedGenerator.error("There is nothing playing.")] });

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
