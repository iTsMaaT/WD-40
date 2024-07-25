const { useQueue, useMainPlayer } = require("discord-player");
const embedGenerator = require("@root/utils/helpers/embedGenerator");

module.exports = {
    name: "shuffle",
    description: "Shuffles the playlist",
    category: "music",
    async execute(logger, client, message, args, optionalArgs) {
        const queue = useQueue(message.guild.id);
        if (!queue) return await message.reply({ embeds: [embedGenerator.error("There is no queue to shuffle.")] });
        if (queue.tracks.size < 2) return await message.reply({ embeds: [embedGenerator.error("There is nothing to shuffle.")] });
        
        try {
            queue.tracks.shuffle();

            const shuffle_embed = embedGenerator.info({
                title: "Queue shuffled",
                description: `Shuffled ${queue.tracks.size} songs.`,
            }).withAuthor(message.author);

            message.reply({ embeds: [shuffle_embed] });
        } catch (e) {
            logger.error(e);
            return await message.reply({ embeds: [embedGenerator.error("An error occurred.")] });
        }
    },
};