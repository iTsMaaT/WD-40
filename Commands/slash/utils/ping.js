const { ApplicationCommandType } = require("discord.js");
const prettyMilliseconds = require("pretty-ms");

module.exports = {
    name: 'ping',
    description: 'Shows bot latency',
    type: ApplicationCommandType.ChatInput,
    async execute(logger, interaction, client) {
        await interaction.deferReply();
        const sent = await interaction.editReply({ content: 'Pinging...', fetchReply: true , allowedMentions: {RepliedUser: false}});

        const pingEmbed = {
            title: "Ping Information",
            color: 0xffffff, 
            fields: [
                { name: "Bot's Ping", value: `\`${client.ws.ping}ms\`` },
                { name: "Uptime", value: `\`${prettyMilliseconds(client.uptime)}\`` },
                { name: "Round Trip Latency", value: `\`${sent.createdTimestamp - interaction.createdTimestamp}ms\`` },
                { name: "Bot's Age", value: `<t:${Math.floor(client.user.createdTimestamp / 1000)}:R>` },
            ],
            timestamp: new Date(),
        };

        await sent.edit({ embeds: [pingEmbed] });
    },
};