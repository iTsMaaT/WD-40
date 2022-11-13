const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const {prettyMilliseconds} = require("pretty-ms")
const wait = require('node:timers/promises').setTimeout;
module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Shows bot latency'),
	async execute(interaction, client) {
        await interaction.deferReply()
		const sent = await interaction.editReply({ content: 'Pinging...', fetchReply: true });
		wait(4000)
		const embed = new EmbedBuilder()
        .setTitle("Bot latency")
        .addFields(
            {name:"Bot latency", value:`${client.ws.ping}` + 'ms'},
            {name:"Bot uptime", value:`${prettyMilliseconds(client.uptime)}`},
			{name:"Round trip latency", value: `${sent.createdTimestamp - interaction.createdTimestamp}ms`}
            )
        .setTimestamp()
		await interaction.editReply({embeds:[embed]});
	},
};