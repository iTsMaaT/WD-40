const prettyMilliseconds = require('pretty-ms');

module.exports = {
    name: "ping",
    description: "Gives ping and uptime, or can give ping a precise number of times with a custom delay inbetween",
    category: "utils",
    async execute(logger, client, message, args) {
        // All ping info, but a single time
        const guild = await client.guilds.fetch(message.guildId);
        const target = await guild.members.fetch("1036485458827415633");
        const sent = await message.reply({ content: 'Pinging...', fetchReply: true , allowedMentions: {RepliedUser: false}});

        const pingEmbed = {
            title: "Ping Information",
            color: 0xffffff, 
            fields: [
                { name: "Bot's Ping", value: `\`${client.ws.ping}ms\`` },
                { name: "Uptime", value: `\`${prettyMilliseconds(client.uptime)}\`` },
                { name: "Round Trip Latency", value: `\`${sent.createdTimestamp - message.createdTimestamp}ms\`` },
                { name: "Bot's Age", value: `<t:${Math.floor(target.user.createdTimestamp / 1000)}:R>` },
            ],
            timestamp: new Date(),
        };

        sent.edit({ embeds: [pingEmbed] });
    },
};
