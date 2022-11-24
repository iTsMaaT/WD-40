
//help command
module.exports={
    name:"help",
    description:"lists commands",
    execute(client,message,args) {
        message.channel.send(`
**help**: This page
**ping / ping <amnt> <time>**: Tells the ping of the bot, and can do multiple times with a delay inbetween
**prefix <new prefix>**: Changes the bot's prefix
**suggestion**: Give a suggestion for the bot

_Admin Only_
**snowflake <User ID>**: Reacts :snowflake: to any message of a user
**Sex <User ID>**: Starts from a random number, then counts everytime the user says sex

_Owner Only_

**activity**: Changes the bot activity status
**nick**: Changes the bot's username
**shutdown**: Destroys the client's process


        `);
    }
}
