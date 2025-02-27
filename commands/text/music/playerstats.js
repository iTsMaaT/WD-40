const { useStats } = require("@utils/helpers/playerHelpers");
const { useQueue } = require("discord-player");
const formatDuration = require("@utils/functions/formatDuration");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "playerstats",
    description: "Get the stats of the current queue",
    category: "music",
    private: true,
    async execute(logger, client, message, args, optionalArgs) {
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