const { EmbedBuilder } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { useQueue, useMainPlayer } = require("discord-player");

module.exports = {
    name: "clear",
    description: "Clear currently playing queue",
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
        if (!queue) return await message.reply({ embeds: [embedGenerator.error("There is no queue to clear.")] });

        queue.tracks.clear();

        const stoppped_music_embed = embedGenerator.info({
            title: "Cleared!",
            description: "Cleared the queue.",
        }).withAuthor(message.author);

        message.reply({ embeds: [stoppped_music_embed] });
    },
};