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
        
        let queue = useQueue(message.guild.id);
        const loopMode = args[0]?.toLowerCase() || "queue";
        const oldLoopMode = getLoopMode(queue);

        if (!queue || !queue.tracks) return await message.reply({ embeds: [embedGenerator.error("There is nothing playing.")] });

        switch (loopMode) {
            case "off":
                queue.setRepeatMode(QueueRepeatMode.OFF);
                break;
            case "song":
            case "track":
                queue.setRepeatMode(QueueRepeatMode.TRACK);
                break;
            case "queue":
                queue.setRepeatMode(QueueRepeatMode.QUEUE);
                break;
            case "autoplay":
                queue.setRepeatMode(QueueRepeatMode.AUTOPLAY);
                break;
            default:
                return await message.reply({ embeds: [embedGenerator.warning("Invalid loop type. (Needs to be: off, queue, song or autoplay)")] });
        }

        queue = useQueue(message.guild.id);

        await message.reply({ embeds: [embedGenerator.info(`Loop mode set from [\`${oldLoopMode}\`] to [\`${getLoopMode(queue)}\`]`)] });
    },
}; 
