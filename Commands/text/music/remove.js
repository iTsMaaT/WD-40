const { useQueue, useMainPlayer } = require("discord-player");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "remove",
    description: "Removes a given track",
    usage: {
        required: {
            "song number": "the song number in the queue to remove",
        },
    },
    category: "music",
    examples: ["3"],
    async execute(logger, client, message, args, optionalArgs) {
        try {
            const queue = useQueue(message.guild.id);

            if (!queue || !queue.tracks || !queue.currentTrack) return await message.reply({ embeds: [embedGenerator.error("There is nothing in the queue / currently playing.")] });

            const remove = parseInt(args[0]);
            const trackResolvable = queue.tracks.at(remove);

            if (isNaN(remove) || !trackResolvable) return await message.reply({ embeds: [embedGenerator.error("Couldn't find song to remove")] });

            queue.node.remove(trackResolvable);

            const embed = embedGenerator.info({
                title: `Removed: ${trackResolvable.title}`,
            }).withAuthor(message.author);

            message.reply({ embeds: [embed] });
        } catch (err) {
            logger.error(e);
            return await message.reply({ embeds: [embedGenerator.error("An error occurred.")] });
        }
    },
};