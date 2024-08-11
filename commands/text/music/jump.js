const embedGenerator = require("@utils/helpers/embedGenerator"); 
const { useQueue, useMainPlayer } = require("discord-player");

module.exports = {
    name: "jump",
    description: "Skips to a precise song",
    usage: {
        required: {
            "song number": "the song number in the queue to jump to",
        },
    },
    category: "music",
    examples: ["3"],
    inVoiceChannel: true,
    execute: async (logger, client, message, args, optionalArgs) => {
        const queue = useQueue(message.guild.id);

        if (!message.member.voice.channel) return await message.reply({ embeds: [embedGenerator.warning("You must be in a voice channel.")] });
        if (!args[0]) return await message.reply({ embeds: [embedGenerator.error("Please enter a number to skip to.")] });

        const tojump = parseInt(args[0]);

        if (tojump > queue.tracks.data.length) return await message.reply({ embeds: [embedGenerator.error("Please enter a number between 1 and " + queue.tracks.data.length)] });

        if (!queue || !queue.tracks) return await message.reply({ embeds: [embedGenerator.error("There is nothing in the queue.")] });

        const trackResolvable = queue.tracks.at(tojump - 1);

        if (!trackResolvable) return await message.reply({ embeds: [embedGenerator.error("Couldn't find song to skip to.")] });

        queue.node.jump(trackResolvable);
        return await message.reply({ embeds: [embedGenerator.info({ 
            title: "Skipped to",
            description: `[${trackResolvable.title}](${trackResolvable.url})`,
        })] });
    },
};
