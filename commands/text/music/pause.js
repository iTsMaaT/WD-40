import { EmbedBuilder } from "discord.js";
import embedGenerator from "#utils/helpers/embedGenerator.js";
import { useQueue, useTimeline, useMainPlayer } from "discord-player";
import { getPauseMode } from "#root/utils/helpers/player/playerHelpers.js";

export default {
    name: "pause",
    description: "Pauses / Resumes currently playing music",
    category: "music",
    inVoiceChannel: true,
    inSameVoiceChannel: true,

    /**
     * @param {import("#utils/log.js")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    async execute(logger, client, message, args, flags) {
        const queue = useQueue();
        const timeline = useTimeline();

        if (!queue || !queue.currentTrack) return await message.reply({ embeds: [embedGenerator.error("There is nothing in the queue right now.")] });

        timeline.paused ? timeline.resume() : timeline.pause();

        const embed = embedGenerator.info({
            title: getPauseMode(timeline),
        }).withAuthor(message.author);

        await message.reply({ embeds: [embed] });
    },
}; 
