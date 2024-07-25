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
        const track = parseInt(args[0]);
        const jump = queue?.tracks.at(track);
        const position = queue?.node.getTrackPosition(jump);
        const tracks = queue?.tracks.map((song, id) => ({
            name: song.title,
            value: ++id,
        }));

        if (jump?.title && !tracks.some((t) => t.name === jump.title)) {
            tracks.unshift({
                name: jump.title,
                value: position,
            });
        }

        if (!queue || !queue.tracks) return await message.reply({ embeds: [embedGenerator.error("There is nothing in the queue.")] });

        if (!args[0]) return await message.reply({ embeds: [embedGenerator.error("Please enter a number to skip to.")] });

        const trackResolvable = queue.tracks.at(jump);

        if (isNaN(track) || !trackResolvable) return await message.reply({ embeds: [embedGenerator.error("Couldn't find song to skip to.")] });

        queue.node.jump(trackResolvable);
        return await message.reply({ embeds: [embedGenerator.info(`Skiped to ${trackResolvable.title}`)] });
    },
};
