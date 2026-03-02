const formatDuration = require("@utils/functions/formatDuration");

module.exports = {
    name: "ping",
    description: "Gives ping and uptime",
    category: "utils",
    aliases: ["uptime"],
    async execute(logger, client, message, args, flags) {
        const sent = await message.reply({ content: "Pinging..." });

        const pingEmbed = {
            title: "Ping Information",
            color: 0xffffff, 
            fields: [
                { name: "Bot's Ping", value: `\`${client.ws.ping.toFixed(2)}ms\`` },
                { name: "Uptime", value: `\`${formatDuration(client.uptime)}\`` },
                { name: "Round Trip Latency", value: `\`${sent.createdTimestamp - message.createdTimestamp}ms\`` },
                { name: "Bot's Age", value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>` },
            ],
            timestamp: new Date(),
        };

        sent.edit({ embeds: [pingEmbed] });
    },
};
