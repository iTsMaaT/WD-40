const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Shows commands'),
	async execute(interaction, client) {

        interaction.reply(`

**help**: This page
**Sex <User ID>**: Starts from a random number, then counts everytime the user says sex
**ping / ping <amnt> <time>**: Tells the ping of the bot, and can do multiple times with a delay inbetween
**prefix <new prefix>**: Changes the bot's prefix
**snowflake <User ID>**: Reacts :snowflake: to any message of a user
**suggestion**: Give a suggestion for the bot
        
        
            `);
        },
    };