const prettyMilliseconds = require('pretty-ms');
const os = require('os');
const changelog = require('../../../../changelogs.json');
const GetPterodactylInfo = require("../../../../utils/functions/GetPterodactylInfo");

module.exports = {
    name: "stats",
    description: "Gives statistics about the bot",
    category: "utils",
    execute: async (logger, client, message, args) => {
        message.channel.sendTyping();
        /*
		TODO
		amount users in present guild
		amount bots (?)
		amount shards
		version
		nodejs version
		
		*/
        const PteroInfo = await GetPterodactylInfo();
        const RamUsageFormatted = `${PteroInfo.ram.usage.clean} / ${PteroInfo.ram.limit.clean} (${PteroInfo.ram.pourcentage.clean})`;
        const prefix = global.GuildManager.GetPrefix(message.guild);
        let lastCommandTimeSinceNow = "";
        let lastExecutedCommand = "";
        let lastCommandLink = "";
        const WDVersion = changelog.slice(-1).map(({version}) => { return version; }).join();
        const Shards = client.options.shardCount ?? 1;
        const nodeVersion = process.version;
        const amountTextCommands = client.commands.filter(val => !val.private).size;
        const amountSlashCommands = client.slashcommands.size;
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const userHere = message.guild.memberCount;
        const totalGuilds = client.guilds.cache.size;
        const totalChannels = client.channels.cache.size;
        const uptime = prettyMilliseconds(client.uptime);
        const ping = client.ws.ping + "ms";
        const botAge = prettyMilliseconds(Date.now() - client.user.createdAt);
        const totalExecutedCommands = await global.prisma.logs.count({ where: { Value: { contains: "Executing [", } } });
        const VoicesPlaying = Array.from(client.voice.adapters.keys()).length;
      
        const lastExecutedCommands = (await global.prisma.message.findMany({
            where: {
                AND: [
                    { Content: { startsWith: prefix, } },
                    { NOT: { MessageID: message.id } },
                    { GuildID: message.guild.id }
                ]
            },
            take: 10,
            orderBy: {
                ID: 'desc'
            }
        }));
        const TextCommands = client.commands.map(command => command.name);
        if (lastExecutedCommands) {
            for (let command in lastExecutedCommands) {
                command = lastExecutedCommands[command];
                if (TextCommands.includes(command.Content?.split(" ")[0]?.replace(prefix, ""))) {
                    lastExecutedCommand = command;
                    break;
                }
            }
        }

        const lastCommandContent = lastExecutedCommand?.Content;
        if (lastExecutedCommand) {
            lastCommandLink = `https://discord.com/channels/${lastExecutedCommand.GuildID}/${lastExecutedCommand.ChannelID}/${lastExecutedCommand.MessageID}`;
            lastCommandTimeSinceNow = prettyMilliseconds(Date.now() - (await client.channels.cache.get(lastExecutedCommand.ChannelID).messages.fetch(lastExecutedCommand.MessageID).then(message => message.createdTimestamp)));
        }

        const embed = {
            title: `Stats for ${client.user.username} (v${WDVersion})`,
            color: 0xffffff,
            description: ``,
            fields: [
                {
                    name: "Commands count",
                    value: `Text commands: **${amountTextCommands}**\nSlash commands: **${amountSlashCommands}**`
                }, {
                    name: "Server count",
                    value: `Guilds: **${totalGuilds}**\nUsers: **${totalUsers}** (Here: **${userHere}**)\nChannels: **${totalChannels}**`
                }, {
                    name: "Connection info",
                    value: `Ping: **${ping}**\nUptime: **${uptime}**`
                }, {
                    name: "Commands stats",
                    value: `Total executed commands (since 08-05-23): **${totalExecutedCommands}**\nLast executed command (in \`${message.guild.name}\`):\n\`${lastCommandContent ?? "None"}\` (${lastCommandTimeSinceNow ?? "Never"} ago) ${lastCommandLink ? `\nLink: ${lastCommandLink}` : ""}`
                }, {
                    name: "Hosting",
                    value: `Host: **${os.platform()} ${os.release()}**\nShard count: **${Shards}**\nNodeJS version: **${nodeVersion}**\nRam usage: **${RamUsageFormatted}**`
                }, {
                    name: "Voice",
                    value: `Playing in **${VoicesPlaying} / ${totalGuilds}** VCs`
                }
            ],
            footer: {
                text: `The bot is ${botAge} old | Created by @itsmaat`
            },
            timestamp: new Date(),
        };
        message.reply({ embeds: [embed] });
    }
};