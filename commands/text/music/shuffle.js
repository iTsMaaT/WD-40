const { useQueue, useMainPlayer } = require("discord-player");
const embedGenerator = require("@root/utils/helpers/embedGenerator");

module.exports = {
    name: "shuffle",
    description: "Shuffles the playlist",
    category: "music",
    inVoiceChannel: true,
    inSameVoiceChannel: true,

    /**
     * @param {import("@utils/log")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    async execute(logger, client, message, args, flags) {
        const queue = useQueue();
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