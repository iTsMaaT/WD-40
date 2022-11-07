import AbstractCommand from "../AbstractCommand.js";

//help command
export default class Help extends AbstractCommand{
    execute(message,args) {
        message.channel.send(`
**help**: This page
**lmao <User ID>**: Starts from a random number, then counts everytime the user says lmao
**ping / ping <amnt> <time>**: Tells the ping of the bot, and can do multiple times with a delay inbetween
**prefix <new prefix>**: Changes the bot's prefix
**snowflake <User ID>**: Reacts :snowflake: to any message of a user



`);
    }
}
