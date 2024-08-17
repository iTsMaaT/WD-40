const prettyMilliseconds = require("pretty-ms");
const os = require("os");
const changelogs = require("@root/changelogs.json");
const embedGenerator = require("@utils/helpers/embedGenerator");
const GetPterodactylInfo = require("@functions/GetPterodactylInfo");
const { sql } = require("drizzle-orm");
const DB = require("@root/utils/db/DatabaseManager");
const GuildManager = require("@root/utils/GuildManager");
const { useMainPlayer } = require("discord-player");

module.exports = {
    name: "stats",
    description: "Gives statistics about the bot",
    category: "utils",
    async execute(logger, client, message, args, optionalArgs) {
        const player = useMainPlayer();

        const addedCommands = new Set();
        client.commands.each((val) => {if (!val.private && !addedCommands.has(val.name))  addedCommands.add(val.name); });
        
        const PteroInfo = await GetPterodactylInfo();
        const RamUsageFormatted = `${PteroInfo.ram.usage.clean} / ${PteroInfo.ram.limit.clean} (${PteroInfo.ram.pourcentage.clean})`;
        const prefix = GuildManager.GetPrefix(message.guild);
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
        const uptime = prettyMilliseconds(client.uptime);
        const ping = client.ws.ping + "ms";
        const botAge = prettyMilliseconds(Date.now() - client.user.createdAt);
        const totalExecutedCommands = (await DB.drizzle.execute(sql`SELECT COUNT(m.ID) AS count FROM Logs m WHERE m.Value LIKE "Executing [%"`))[0][0].count;
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
            lastCommandTimeSinceNow = prettyMilliseconds(Date.now() - lastExecutedCommand.createdTimestamp);
        }

        const embed = {
            title: `Stats for ${client.user.username} (v${WDVersion})`,
            color: 0xffffff,
            description: "",
            fields: [
                {
                    name: "Commands count",
                    value: `
                    Text commands: **${amountTextCommands}**
                    Slash commands: **${amountSlashCommands}**`,
                }, {
                    name: "Server count",
                    value: `
                    Guilds: **${totalGuilds}**
                    Users: **${totalUsers}** (Here: **${userHere}**)
                    Channels: **${totalChannels}**`,
                }, {
                    name: "Connection info",
                    value: `
                    Ping: **${ping}**
                    Uptime: **${uptime}**`,
                }, {
                    name: "Commands stats",
                    value: `
                    Total executed commands (appromixately): **${totalExecutedCommands}**
                    Last executed command (in \`${message.guild.name}\`):
                    \`${lastCommandContent ?? "None"}\` (${lastCommandTimeSinceNow ?? "Never"} ago) ${lastCommandLink ? `
                    Link: ${lastCommandLink}` : ""}`,
                }, {
                    name: "Hosting",
                    value: `
                    Host: **${os.platform()} ${os.release()}**
                    Shard count: **${Shards}**
                    NodeJS version: **${nodeVersion}**\nRam usage: **${RamUsageFormatted}**`,
                }, {
                    name: "Voice",
                    value: `
                    Playing in **${VoicesPlaying} / ${totalGuilds}** VCs
                    Queues: **${playerStatitics.queues.length}**
                    Tracks: **${totalTracks}**
                    Listeners: **${totalListeners}**`,
                },
            ],
            footer: {
                text: `The bot is ${botAge} old | Created by @itsmaat`,
            },
            timestamp: new Date(),
        };
        message.reply({ embeds: [embed] });
    },
};