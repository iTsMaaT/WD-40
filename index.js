import { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, SelectMenuOptionBuilder } from "discord.js";
import dotenv from "dotenv";
import Sex from "./Commands/Sex.js";
import Ping from "./Commands/Ping.js";
import Prefix from "./Commands/Prefix.js";
import Snowflake from "./Commands/Snowflake.js";
import Test from "./Commands/Test.js";
import Help from "./Commands/Help.js";
import Shutdown from "./Commands/Shutdown.js";
dotenv.config();

global.prefix = '>';
global.SnowflakeID = 0;
global.LmaoID = 0;
global.LmaoCount = 0;


global.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

let commands = [
    new Test("test"),
    new Snowflake("snowflake"),
    new Ping("ping"),
    new Prefix("prefix"),
    new Sex("sex"),
    new Help("help"),
    new Shutdown("shutdown"),

]
/*
import AbstractCommand from "../AbstractCommand.js";
export default class --- extends AbstractCommand{
    execute(message,args) {

    }
}
*/

client.on("ready", () => {
    console.log("Bot starting...");

    client.user.setActivity(`Time to be annoying!`);
    
    setTimeout(function(){
        client.channels.cache.get("1037141235451842701").send(`Bot Online!, **Ping**: \`${client.ws.ping}ms\``);
        console.log("Bot started successfully.");
        },1000 * 1)
})

client.on("messageCreate", (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(prefix)) {

        const args = message.content.slice(prefix.length).split(/ +/);
        const command = args.shift().toLowerCase();

        //commands
        var cmd = commands.filter(c => c.parse(command)).shift();
        if (cmd !== undefined) {
            cmd.execute(message,args);
        }
    }

    //reacts :sick: when gros gaming or smartass is said
    if(message.content.toLowerCase().includes("gros gaming") || message.content.toLowerCase().includes("smartass")) {
        message.react('🤢')
    }

    //what? eveeeer
    if(message.content.toLowerCase() == `what` || message.content == `what?` || message.content == `What?`) {
        message.reply("ever!")
    }

    //Lmao count with ID
    if(message.content.toLowerCase() == `lmao` && message.author.id == LmaoID) {
        message.reply(`Dude this is the ${LmaoCount}th time you said that, please shut up`)
        LmaoCount += 1;
    }

    //skull reaction to skull emoji
    if(message.content.toLowerCase() == `💀`) {
        message.react('💀') 
    }
    
    //Snowflake reaction
    if (SnowflakeID != 0 && message.author.id == SnowflakeID) {
           message.react('❄️');
    }

    //gives the bot prefix and help command when the bot is pinged
    if(message.content == "<@1036485458827415633>") {
        message.channel.send (`Bot's prefix : \`${prefix}\`\nHelp command: \`${prefix}help\``);
    }

    //reacts :gorilla: when pinging iTsMaaT
    if(message.content.include("<@411996978583699456>")) {
        message.react('🦍')
    }

})
client.login(process.env.TOKEN);