const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Shows commands'),
    async execute(interaction, client) {

        interaction.reply(`

**help**: This page
**ping / ping <amnt> <time>**: Tells the ping of the bot, and can do multiple times with a delay inbetween
**prefix <new prefix>**: Changes the bot's prefix
**suggestion**: Give a suggestion for the bot
**serverinfo**: Gives info about the server
**userinfo <User>**: Gives info about a user's account
**rule34**: You know what this is
**reddit <subreddit>**: Sends an image or valid gif from the desired subreddit
        
__Admin Only__
**snowflake <User ID>**: Reacts :snowflake: to any message of a user
**Sex <User ID>**: Starts from a random number, then counts everytime the user says sex
        
__Owner Only__
**activity**: Changes the bot activity status
**nick**: Changes the bot's username
**shutdown**: Destroys the client's process
        
- - - - - - - - - - - - - - - - - 
        
__Auto Responses (Spoiler ahead)__
||What/What?/Who/Who? => ever!
ever => What?
en pause => Ta mere
\`@everyone\`/\`@here\` (But no mention perms) => Ping fail L
bruh => bruh
stuff => \\<Stuff meme image\\>
        
Reactions
Smartass/edging/gros gaming => s t f u
\`@iTsMaaT\` => Gorilla||    
        
            `);
    },
};