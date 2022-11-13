const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField, SelectMenuOptionBuilder, Events } = require("discord.js");
const cron = require("cron");
const dotenv = require("dotenv");
dotenv.config();
const Discord = require('discord.js');
const fs = require('fs');
const path = require('node:path')
global.prefix = '>';
let SnowflakeID = 0;
let SexID = 0;
let SexCount = 0;


client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

//create a collection for text commands
client.commands = new Discord.Collection();
//create a collection for slash commands
client.slashcommands = new Discord.Collection();

const slashcommandsPath = path.join(__dirname, 'slash');
const slashcommandFiles = fs.readdirSync(slashcommandsPath).filter(file => file.endsWith('.js'));

for (const file of slashcommandFiles) {
	const filePath = path.join(slashcommandsPath, file);
	const slashcommand = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in slashcommand && 'execute' in slashcommand) {
		client.slashcommands.set(slashcommand.data.name, slashcommand);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

const commandFiles = fs.readdirSync('./Commands/').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./Commands/${file}`);

    client.commands.set(command.name, command)
}
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
    let scheduledMessage = new cron.CronJob('11 11 11 * * *', () => {
    // This runs every day at 11:11:11
    client.channels.cache.get("885302577414152233").send(":pray: Allah :pray:");
    });
    //sarting the daily sending
    scheduledMessage.start()
    
    //start confirmation
    setTimeout(function(){
        client.channels.cache.get("1037141235451842701").send(`Bot Online!, **Ping**: \`${client.ws.ping}ms\``);
        console.log("Bot started successfully.");
        },1000 * 1)

        
})

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const slash = interaction.client.slashcommands.get(interaction.commandName);

	if (!slash) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
        //execute the slash command
		await slash.execute(interaction, client);
	} catch (error) {
		console.error(`Error executing ${interaction.commandName}`);
		console.error(error);
	}
});

client.on("messageCreate", (message) => {
    if (message.author.bot) return;
    if (message.content.startsWith(prefix)) {

        const args = message.content.slice(prefix.length).split(/ +/);
        const command = args.shift().toLowerCase();

    // If command does not exist, return
    if (!client.commands.get(command)) {
        return
    }
      
    client.commands.get(command).execute(client, message, args)


    }

    //reacts :sick: when gros gaming or smartass is said
    if(message.content.toLowerCase().includes("gros gaming") || message.content.toLowerCase().includes("smartass") || message.content.toLowerCase().includes("edging")) {
        message.react('🇸')
			.then(() => message.react('🇹'))
			.then(() => message.react('🇫'))
            .then(() => message.react('🇺'));
    }

    //what? eveeeer
    if(message.content.toLowerCase() == `what` || message.content == `what?` || message.content == `What?` || 
       message.content.toLowerCase() == `who` || message.content == `who?` || message.content == `Who?`) {
        message.reply("ever!")
    }

    //ever what?
    if(message.content.toLowerCase() == `ever`) {
        message.reply("What?")
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

    //answers your mom when asking who's at break
    if(message.content.toLowerCase().includes("en pause")) {
        message.channel.send("Ta mère")
    }

    //Ping fail if doesnt have @everyone perm
    if (!message.member.permissions.has("MentionEveryone") && (message.content.includes("@everyone") || message.content.includes("@here"))) {
        message.reply("Ping fail");
    }

    //answers bruh to bruh
    if(message.content.toLowerCase() == "bruh") {
        message.reply("bruh")
    }

    if(message.content.toLowerCase().includes("stuff")) {
        message.reply("https://media.discordapp.net/attachments/774305852323790873/1040424470483046462/8fa.png?width=628&height=670")
    }
})
client.login(process.env.TOKEN);