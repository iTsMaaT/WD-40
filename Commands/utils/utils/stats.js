const prettyMilliseconds = require('pretty-ms');

module.exports = {
    name: "stats",
    description: "Gives info of a server",
    category: "utils",
    execute: async (logger, client, message, args) => {
        const prefix = global.GuildManager.GetPrefix(message.guild);
        let lastCommandTimeSinceNow = "";
        let lastExecutedCommand = "";
        const amountTextCommands = client.commands.filter(val => !val.private).size;
        const amountSlashCommands = client.slashcommands.size;
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const totalGuilds = client.guilds.cache.size;
        const totalChannels = client.channels.cache.size;
        const uptime = prettyMilliseconds(client.uptime);
        const ping = client.ws.ping + "ms";
        const botAge = prettyMilliseconds(Date.now() - client.user.createdAt);
        const totalExecutedCommands = await global.prisma.logs.count({ where: { Value: { contains: "Executing [", } } });
      
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
        for (let command in lastExecutedCommands) {
            command = lastExecutedCommands[command];
            if (TextCommands.includes(command.Content.split(" ")[0].replace(prefix, ""))) {
                lastExecutedCommand = command;
                break;
            }
        }

        const lastCommandContent = lastExecutedCommand?.Content;
        if (lastExecutedCommand) lastCommandTimeSinceNow = prettyMilliseconds(Date.now() - (await client.channels.cache.get(lastExecutedCommand.ChannelID).messages.fetch(lastExecutedCommand.MessageID).then(message => message.createdTimestamp)));

        const embed = {
            title: `Stats for ${client.user.name}`,
            color: 0xffffff,
            description: ``,
            fields: [
                {
                    name: "Commands count",
                    value: `Text commands: **${amountTextCommands}**\nSlash commands: **${amountSlashCommands}**`
                }, {
                    name: "Server count",
                    value: `Guilds: **${totalGuilds}**\nUsers: **${totalUsers}**\nChannels: **${totalChannels}**`
                }, {
                    name: "Connection info",
                    value: `Ping: **${ping}**\nUptime: **${uptime}**`
                }, {
                    name: "Commands stats",
                    value: `Total executed command (since 08-05-23): **${totalExecutedCommands}**\nLast executed command: \`${lastCommandContent ?? "None"}\` (${lastCommandTimeSinceNow + " ago" ?? "N/A"})`
                }
            ],
            footer: {
                text: `The bot is ${botAge} old`
            },
            timestamp: new Date(),
        };
        message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
    }
};