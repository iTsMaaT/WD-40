const embedGenerator = require("@utils/helpers/embedGenerator"); 
const { useQueue, useMainPlayer } = require("discord-player");

module.exports = {
    name: "move",
    description: "Moves a song to a specific position in the queue",
    usage: {
        required: {
            "from": "the song number to go from",
            "to": "the song number to go to",
        },
    },
    category: "music",
    examples: ["3 5"],
    inVoiceChannel: true,
    async execute(logger, client, message, args, optionalArgs) {
        const queue = useQueue(message.guild.id);
        const fromPosition = parseInt(args[0]);
        const toPosition = parseInt(args[1]);

        if (!message.member.voice.channel) return await message.reply({ embeds: [embedGenerator.warning("You must be in a voice channel.")] });
        if (!args[0]) return await message.reply({ embeds: [embedGenerator.error("Please enter a number to go from.")] });
        if (!args[1]) return await message.reply({ embeds: [embedGenerator.error("Please enter a number to go to.")] });

        if (fromPosition > queue.tracks.data.length || toPosition > queue.tracks.data.length) 
            return await message.reply({ embeds: [embedGenerator.error("Please enter a number between 1 and " + queue.tracks.data.length)] });
        
        if (!queue || !queue.tracks) return await message.reply({ embeds: [embedGenerator.error("There is nothing in the queue.")] });

        const trackToMove = queue.tracks.data[fromPosition - 1];
        queue.node.move(trackToMove, toPosition - 1);

        return await message.reply({ embeds: [embedGenerator.info({ 
            title: `Moved song to position ${toPosition}`,
            description: `[${trackToMove.title}](${trackToMove.url})`,
        })] });
    },
};
