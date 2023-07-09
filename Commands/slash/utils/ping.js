const { ApplicationCommandType } = require("discord.js");
const prettyMilliseconds = require("pretty-ms");
module.exports = {
    name: 'ping',
    description: 'Shows bot latency',
    type: ApplicationCommandType.ChatInput,
    async execute(logger, interaction, client) {
        await interaction.deferReply();
        const guild = await client.guilds.fetch(interaction.guildId);
        const target = await guild.members.fetch("1036485458827415633");
        const sent = await interaction.editReply({ content: 'Pinging...', fetchReply: true });

        //Gives the ping in ms, uptime in days, round trip latency in ms and the bots age in relative time
        interaction.editReply( {content :`

My ping is \`${client.ws.ping}ms\`
Uptime : \`${prettyMilliseconds(client.uptime)}\`
Round trip latency : \`${sent.createdTimestamp - interaction.createdTimestamp}ms\`
Bot's age : <t:${parseInt(target.user.createdTimestamp / 1000)}:R>

            `, ephemeral: true });
    },
};