const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const prettyMilliseconds = require("pretty-ms");
const wait = require('node:timers/promises').setTimeout;
module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Shows bot latency'),
	async execute(interaction, client) {
        await interaction.deferReply()
		const sent = await interaction.editReply({ content: 'Pinging...', fetchReply: true });
    
        interaction.editReply(`

My ping is \`${client.ws.ping}ms\`
Uptime : \`${prettyMilliseconds(client.uptime)}\`
Round trip latency : \`${sent.createdTimestamp - interaction.createdTimestamp}ms\`
            `);
	},
};