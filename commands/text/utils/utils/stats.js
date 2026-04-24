const formatDuration = require("@utils/functions/formatDuration");
const os = require("os");
const changelogs = require("@root/changelogs.json");
const embedGenerator = require("@utils/helpers/embedGenerator");
const getPterodactylInfo = require("@root/utils/functions/getPterodactylInfo");
const { sql } = require("drizzle-orm");
const DB = require("@root/utils/db/databaseManager");
const GuildManager = require("@guildManager");
const { useMainPlayer } = require("discord-player");
const { toEngineerNotation } = require("@functions/formattingFunctions");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const { AttachmentBuilder } = require("discord.js");
const config = require("@utils/config/configUtils");
let totalUserCache = 0;
const rounding = 200;
let imageCache = null;

const chartJSNodeCanvas = new ChartJSNodeCanvas({
    width: 800,
    height: 600,
    backgroundColour: "#222222",
});

module.exports = {
    name: "stats",
    description: "Gives statistics about the bot",
    category: "utils",
    async execute(logger, client, message, args, flags) {
        const player = useMainPlayer();

        const addedCommands = new Set();
        client.commands.each((val) => {if (!val.private && !addedCommands.has(val.name))  addedCommands.add(val.name); });
        
        const PteroInfo = await getPterodactylInfo();
        const RamUsageFormatted = `${PteroInfo?.ram.usage.clean || (toEngineerNotation(process.memoryUsage().rss) + "B rss")} / ${PteroInfo?.ram.limit.clean || (toEngineerNotation(process.memoryUsage().heapTotal) + "B heap")} (${PteroInfo?.ram.pourcentage.clean || "N/A"})`;
        const prefix = GuildManager.GetPrefix(message.guild.id);
        let lastCommandTimeSinceNow = "";
        let lastExecutedCommand = "";
        let lastCommandLink = "";
        const WDVersion = changelogs[changelogs.length - 1].version;
        const Shards = client.options.shardCount ?? 1;
        const nodeVersion = process.version;
        const amountTextCommands = addedCommands.size;
        const amountSlashCommands = client.slashcommands.size;
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const userHere = message.guild.memberCount;
        const totalGuilds = client.guilds.cache.size;
        const totalChannels = client.channels.cache.size;
        const uptime = formatDuration(client.uptime);
        const ping = client.ws.ping + "ms";
        const botAge = formatDuration(Date.now() - client.user.createdAt);
        const botJoinDate = message.guild.members.cache.get(client.user.id)?.joinedAt;
        let totalExecutedCommands;
        try {
            totalExecutedCommands = (await DB.drizzle.execute(sql`SELECT COUNT(m.ID) AS count FROM Logs m WHERE m.Value LIKE "Executing [%"`))[0][0].count;
        } catch (ex) {
            totalExecutedCommands = "N/A (DB not connected)";
        }
        const VoicesPlaying = client.voice.adapters.size;
        const playerStatitics = player.generateStatistics();
        let totalTracks = 0;
        let totalListeners = 0;
        playerStatitics.queues.map((queue) => {
            totalTracks += queue.status.playing ? queue.tracksCount + 1 : queue.tracksCount;
            totalListeners += queue.listeners;
        });
      
        const fetchedMessages = await message.channel.messages.fetch({ limit: 100 });
        const lastExecutedCommands = Array.from(fetchedMessages.values()).filter(msg => 
            msg.content.startsWith(prefix) && 
            msg.id !== message.id,
        ).sort((a, b) => b.createdTimestamp - a.createdTimestamp).slice(0, 10);        
        const TextCommands = client.commands.map(command => command.name);
        for (const command of lastExecutedCommands) {
            if (TextCommands.includes(command.content.split(" ")[0].replace(prefix, ""))) {
                lastExecutedCommand = command;
                break;
            }
        }

        const lastCommandContent = lastExecutedCommand?.content;
        if (lastExecutedCommand) {
            lastCommandLink = `https://discord.com/channels/${lastExecutedCommand.guild.id}/${lastExecutedCommand.channel.id}/${lastExecutedCommand.id}`;
            lastCommandTimeSinceNow = formatDuration(Date.now() - lastExecutedCommand.createdTimestamp);
        }

        const timestamps = [];
        for (const [guildId, guild] of client.guilds.cache) {
            try {
                const botMember = await guild.members.fetch(client.user.id);
                const userCount = guild.memberCount;
                timestamps.push({ joinedTimestamp: botMember.joinedTimestamp, userCount });
            } catch (err) {
                console.error(`Failed to fetch bot member for guild ${guild.name}:`, err);
            }
        }

        let attachment = null;
        if (timestamps && timestamps.length > 0) {
            const buffer = await generateChartBuffer(timestamps);
            attachment = new AttachmentBuilder(buffer, { name: "user_growth.png" });
        }

        const embed = {
            title: `Stats for ${client.user.username} (v${WDVersion})`,
            color: 0xffffff,
            description: "",
            fields: [
                {
                    name: "Commands count",
                    value: 
                    `Text commands: **${amountTextCommands}**\n` + 
                    `Slash commands: **${amountSlashCommands}**`,
                }, {
                    name: "Server count",
                    value: 
                    `Guilds: **${totalGuilds}**\n` + 
                    `Users: **${totalUsers}** (Here: **${userHere}**)\n` + 
                    `Channels: **${totalChannels}**\n` +
                    `Bot joined this server on: **${botJoinDate.toDateString()}**`,
                }, {
                    name: "Connection info",
                    value: 
                    `Ping: **${ping}**\n` + 
                    `Uptime: **${uptime}**`,
                }, {
                    name: "Commands stats",
                    value: 
                    `Total executed commands (approximately): **${totalExecutedCommands}**\n` +
                    `Last executed command (in \`${message.guild.name}\`):\n` + 
                    `\`${lastCommandContent ?? "None"}\` (${lastCommandTimeSinceNow || "Never"} ago) ${lastCommandLink ? `Link: ${lastCommandLink}` : ""}`,
                }, {
                    name: "Hosting",
                    value: 
                    `Host: **${os.platform().replace(/win32/g, "Windows")} ${os.release()}**\n` + 
                    `Architecture: **${os.arch()}**\n` +
                    `cores: **${os.cpus().length}**\n` +
                    `Shard count: **${Shards}**\n` + 
                    `NodeJS version: **${nodeVersion}**\n` + 
                    `Ram usage: **${RamUsageFormatted}**`,
                }, {
                    name: "Voice",
                    value: 
                    `Playing in **${VoicesPlaying} / ${totalGuilds}** VCs\n` + 
                    `Queues: **${playerStatitics.queues.length}**\n` + 
                    `Tracks: **${totalTracks}**\n` + 
                    `Listeners: **${totalListeners}**`,
                },
            ],
            image: {
                url: "attachment://user_growth.png",
            },
            footer: {
                text: `The bot is ${botAge} old | Created by @itsmaat`,
            },
            timestamp: new Date(),
        };

        message.reply({ embeds: [embed], files: [attachment] });
    },
};

/**
 * Generates a chart buffer for the given timestamps
 * @param {Array<{ joinedTimestamp: number, userCount: number }>} timestamps - The timestamps to generate the chart for
 * @returns {Promise<Buffer>} The generated chart buffer
 */
async function generateChartBuffer(timestamps) {
    const sortedData = timestamps.sort((a, b) => a.joinedTimestamp - b.joinedTimestamp);

    const countPerDay = {};
    sortedData.forEach(({ joinedTimestamp, userCount }) => {
        const day = new Date(joinedTimestamp).toISOString().split("T")[0];
        countPerDay[day] = (countPerDay[day] || 0) + userCount;
    });

    const startDate = new Date(Object.keys(countPerDay)[0]);
    const endDate = new Date();
    const labels = [];
    const data = [];
    let totalUsers = 0;
    for (
        let date = new Date(startDate.getTime());
        date <= endDate;
        date = new Date(date.getTime() + 24 * 60 * 60 * 1000)
    ) {
        const day = date.toISOString().split("T")[0];
        totalUsers += countPerDay[day] || 0; // Add 0 if no new members joined on this day
        labels.push(day);
        data.push(totalUsers);
    }

    
    const currentTotal = Object.values(countPerDay).reduce((acc, count) => acc + count, 0);
    if (imageCache &&
    Math.round(currentTotal / rounding) * rounding ===
    Math.round(totalUserCache / rounding) * rounding) 
        return imageCache;


    totalUserCache = Object.values(countPerDay).reduce((acc, count) => acc + count, 0);

    const chartData = labels.map((label, i) => ({
        x: new Date(label).getTime(), // numeric timestamp
        y: data[i],
    }));

    const lastTimestamp = new Date(labels[labels.length - 1]).getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    const timeZone = config.get("timeZone") || "UTC";
    const locale = config.get("locale") || "en-CA";

    const configChart = {
        type: "line",
        data: {
            datasets: [{
                label: "Users Joined Over Time",
                data: chartData,
                borderColor: "white",
                borderWidth: 2,
                fill: false,
                tension: 0.1,
                pointRadius: 0,
            }],
        },
        options: {
            scales: {
                x: {
                    type: "linear",
                    ticks: {
                        callback: function(value) {
                            const date = new Date(value);
                            return date.toLocaleDateString(locale, { timeZone });
                        },
                        color: "white",
                        // maxTicksLimit: 7,
                    },
                    title: {
                        display: true,
                        text: "Date",
                        color: "white",
                    },
                    min: chartData[0].x,
                    max: lastTimestamp + oneDay,

                },
                y: {
                    ticks: { color: "white" },
                    title: {
                        display: true,
                        text: "Total Users",
                        color: "white",
                    },
                },
            },
            plugins: {
                title: {
                    display: true,
                    text: "Bot User Growth History",
                    color: "white",
                },
                legend: {
                    labels: {
                        color: "white",
                    },
                },
            },
        },
    };

    const finalBuffer = await chartJSNodeCanvas.renderToBuffer(configChart);
    imageCache = finalBuffer;
    return finalBuffer;
}