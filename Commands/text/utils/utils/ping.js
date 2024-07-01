const prettyMilliseconds = require("pretty-ms");

module.exports = {
    name: "ping",
    description: "Gives ping and uptime",
    category: "utils",
    async execute(logger, client, message, args, found) {
        const sent = await message.reply({ content: "Pinging...", fetchReply: true, allowedMentions: { RepliedUser: false } });

        const pingEmbed = {
            title: "Ping Information",
            color: 0xffffff, 
            fields: [
                { name: "Bot's Ping", value: `\`${client.ws.ping}ms\`` },
                { name: "Uptime", value: `\`${prettyMilliseconds(client.uptime)}\`` },
                { name: "Round Trip Latency", value: `\`${sent.createdTimestamp - message.createdTimestamp}ms\`` },
                { name: "Bot's Age", value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>` },
            ],
            timestamp: new Date(),
        };

        sent.edit({ embeds: [pingEmbed] });
    },
};
