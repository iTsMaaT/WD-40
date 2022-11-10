import { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, SelectMenuOptionBuilder } from "discord.js";
import cron from "cron";
import dotenv from "dotenv";
import Sex from "./Commands/Sex.js";
import Ping from "./Commands/Ping.js";
import Prefix from "./Commands/Prefix.js";
import Snowflake from "./Commands/Snowflake.js";
import Test from "./Commands/Test.js";
import Help from "./Commands/Help.js";
import Shutdown from "./Commands/Shutdown.js";
import Suggestion from "./Commands/Suggestion.js";
dotenv.config();

global.prefix = '>';
global.SnowflakeID = 0;
global.SexID = 0;
global.SexCount = 0;


global.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

let commands = [
    new Test("test"),
    new Snowflake("snowflake"),
    new Ping("ping"),
    new Prefix("prefix"),
    new Sex("sex"),
    new Help("help"),
    new Shutdown("shutdown"),
    new Suggestion("suggestion"),
    

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
        
    //Allah everyday at 2:22
    let scheduledMessage = new cron.CronJob('00 22 02 * * *', () => {
    // This runs every day at 02:22:00
    client.channels.get("885302577414152233").send(":pray: Allah :pray:");
    });
    
    scheduledMessage.start()
    
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
    if(message.content.toLowerCase().includes("gros gaming") || message.content.toLowerCase().includes("smartass") || message.content.toLowerCase().includes("edging")) {
        message.react('🤡')
			//.then(() => message.react('t'))
			//.then(() => message.react('f'))
            //.then(() => message.react('u'));
    }

    //what? eveeeer
    if(message.content.toLowerCase() == `what` || message.content == `what?` || message.content == `What?`) {
        message.reply("ever!")
    }

    //Sex count with ID
    if(message.content.toLowerCase() == `sex` && message.author.id == SexID) {
        message.reply(`Dude this is the ${SexCount}th time you said that, please shut up`)
        SexCount += 1;
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
    if(message.content.includes("<@411996978583699456>")) {
        message.react('🦍')
    }
    
    if(message.content.includes("en pause?")) {
        message.channel.send("Ta mère")
    }

    //Ping fail if doesnt have @everyone perm
    if (!message.member.permissions.has("MentionEveryone") && (message.content.includes("@everyone") || message.content.includes("@here"))) {
        message.reply("Ping fail");
    }

    if(message.content.toLowerCase() == "bruh") {
        message.reply("bruh")
    }
    

})
client.login(process.env.TOKEN);