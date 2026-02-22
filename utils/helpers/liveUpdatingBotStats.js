const embedGenerator = require("@utils/helpers/embedGenerator");
const formatDuration = require("@utils/functions/formatDuration");
const logger = require("@utils/log");
const os = require("os");
const changelogs = require("@root/changelogs.json");
const getPterodactylInfo = require("@root/utils/functions/getPterodactylInfo");
const { sql, desc } = require("drizzle-orm");
const DB = require("@root/utils/db/databaseManager");
const GuildManager = require("@guildManager");
const { useMainPlayer } = require("discord-player");
const cron = require("cron");
const { toEngineerNotation } = require("@functions/formattingFunctions");
const config = require("@utils/config/configUtils");
const timeZone = config.get("timeZone");
const getExactDate = require("@functions/getExactDate");

/**
 * LiveUpdatingBotStats class.
 * 
 * @class LiveUpdatingBotStats
 */
class LiveUpdatingBotStats {
    constructor(client, channel, cronTime) {
        this.client = client;
        this.channel = channel;
        this.cronTime = cronTime || "0 * * * *";
    }

    /**
     * Starts the live updating bot stats (unless in dev).
     * 
     * @returns {Promise<void>}
     */
    async start() {
        if (process.env.SERVER === "dev" || !DB.dbExists()) return;
        const jobExecution = async () => {
            const embed = await this.generateStatsEmbed();
            this.handleMessage({ embeds: [embed] });
        };

        jobExecution();
        new cron.CronJob(this.cronTime, jobExecution, null, true, timeZone);
    }

    /**
     * Generates the stats embed.
     * 
     * @returns {Promise<object>} The stats embed.
     */
    async generateStatsEmbed() {
        const PteroInfo = await getPterodactylInfo();
        const RamUsageFormatted = `${PteroInfo?.ram.usage.clean || (toEngineerNotation(process.memoryUsage().rss) + "B rss")} / ${PteroInfo?.ram.limit.clean || (toEngineerNotation(process.memoryUsage().heapTotal) + "B heap")} (${PteroInfo?.ram.pourcentage.clean || "N/A"})`;
        const WDVersion = changelogs[changelogs.length - 1].version;
        const totalUsers = this.client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const totalGuilds = this.client.guilds.cache.size;
        const totalChannels = this.client.channels.cache.size;
        const uptime = formatDuration(this.client.uptime);
        const ping = this.client.ws.ping + "ms";
        const botAge = formatDuration(Date.now() - this.client.user.createdAt);
        const VoicesPlaying = this.client.voice.adapters.size;
        const player = useMainPlayer();
        const playerStatitics = player.generateStatistics();
        let totalTracks = 0;
        let totalListeners = 0;
        playerStatitics.queues.map((queue) => {
            totalTracks += queue.status.playing ? queue.tracksCount + 1 : queue.tracksCount;
            totalListeners += queue.listeners;
        });
        let totalExecutedCommands;
        try {
            totalExecutedCommands = (await DB.drizzle.execute(sql`SELECT COUNT(m.ID) AS count FROM Logs m WHERE m.Value LIKE "Executing [%"`))[0][0].count;
        } catch (ex) {
            totalExecutedCommands = "N/A (DB not connected)";
        }

        const severeLogCount = logger.logCounts.severe;
        const errorLogCount = logger.logCounts.error;
        const warningLogCount = logger.logCounts.warning;
        const infoLogCount = logger.logCounts.info;
        const debugLogCount = logger.logCounts.debug;
        const totalLogCount = logger.getTotalLogCount();
        const allTimeLogCount = await logger.getAllTimeLogCount();

        const embed = embedGenerator.info({
            title: `Live bot stats (v${WDVersion})`,
            description: `Last updated at ${getExactDate()}`,
            fields: [
                {
                    name: "Server count",
                    value: 
                    `Guilds: **${totalGuilds}**\n` + 
                    `Users: **${totalUsers}**\n` + 
                    `Channels: **${totalChannels}**`,
                }, {
                    name: "Connection info",
                    value: 
                    `Ping: **${ping}**\n` + 
                    `Uptime: **${uptime}**`,
                }, {
                    name: "Commands stats",
                    value: 
                    `Total executed commands (approximately): **${totalExecutedCommands}**`,
                }, {
                    name: "Hosting",
                    value: 
                    `Host: **${os.platform().replace(/win32/g, "Windows")} ${os.release()}**\n` + 
                    `Architecture: **${os.arch()}**\n` +
                    `cores: **${os.cpus().length}**\n` +
                    `Ram usage: **${RamUsageFormatted}**`,
                }, {
                    name: "Voice",
                    value: 
                    `Playing in **${VoicesPlaying} / ${totalGuilds}** VCs\n` + 
                    `Queues: **${playerStatitics.queues.length}**\n` + 
                    `Tracks: **${totalTracks}**\n` + 
                    `Listeners: **${totalListeners}**`,
                }, {
                    name: "Severe logs",
                    value: severeLogCount,
                    inline: true,
                }, {
                    name: "Error logs",
                    value: errorLogCount,
                    inline: true,
                }, {
                    name: "Warning logs",
                    value: warningLogCount,
                    inline: true,
                }, {
                    name: "Info logs",
                    value: infoLogCount,
                    inline: true,
                }, {
                    name: "Total logs",
                    value: totalLogCount,
                    inline: true,
                }, {
                    name: "Debug logs",
                    value: debugLogCount,
                    inline: true,
                }, {
                    name: "All-Time Total logs",
                    value: allTimeLogCount,
                },
            ],
            footer: {
                text: `The bot is ${botAge} old | Created by @itsmaat`,
            },
        });

        return embed;
    }

    /**
     * Handles the sending of a message to the channel.
     * @param {object} channel - The channel object.
     * @param {string} messageCreateOptions - The message options.
     * 
     * @returns {Promise<void>}
     */
    async handleMessage(messageCreateOptions) {
        let lastMessage;
        try {
            lastMessage = (await this.channel.messages.fetch({ limit: 1 })).first();
        } catch (error) {
            logger.error(`Failed to fetch messages: ${error.message}`);
        }

        try {
            if (lastMessage && lastMessage.author.id === this.client.user.id) {
                await lastMessage.edit(messageCreateOptions);
            } else {
                if (lastMessage) await lastMessage.delete();
                await this.channel.send(messageCreateOptions);
            }
        } catch (error) {
            try {
                await this.channel.send(messageCreateOptions);
            } catch (error) {
                logger.severe(`Failed to send message to channel: ${error.message}`);
            }
        }
    }
}

module.exports = LiveUpdatingBotStats;