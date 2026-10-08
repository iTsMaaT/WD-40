const { useStats } = require("@root/utils/helpers/player/playerHelpers");
const { useQueue } = require("discord-player");
const formatDuration = require("@utils/functions/formatDuration");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "playerstats",
    description: "Get the stats of the current queue",
    category: "music",
    private: true,

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
        if (!queue) return await message.reply({ embeds: [embedGenerator.error("There is no queue.")] });

        const stats = useStats(message.guild);
        if (!stats) return await message.reply({ embeds: [embedGenerator.error("There is no stats.")] });
        const embed = embedGenerator.info({
            title: "Queue stats",
            fields: [
                { 
                    name: "Status", 
                    value: 
                    `**Buffering:** ${stats.status.buffering ? "✅" : "❌"}\n` + 
                    `**Playing:** ${stats.status.playing ? "✅" : "❌"}\n` + 
                    `**Paused:** ${stats.status.paused ? "✅" : "❌"}\n` + 
                    `**Idle:** ${stats.status.idle ? "✅" : "❌"}`,
                },
                {
                    name: "Info",
                    value:
                    `**Tracks amount:** ${stats.tracksCount}\n` +
                    `**History size:** ${stats.historySize}\n` +
                    `**Extractors:** ${stats.extractors}\n` +
                    `**Listeners:** ${stats.listeners}\n`,
                },
                {
                    name: "Latencies",
                    value:
                    `**Event loop:** ${formatDuration(stats.latency.eventLoop)}\n` +
                    `**Voice connection:** ${formatDuration(stats.latency.voiceConnection)}\n`,
                },
            ],
        });

        await message.reply({ embeds: [embed] });
    },
};