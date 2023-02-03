const { Client, Intents, GatewayIntentBits, EmbedBuilder, PermissionsBitField, SelectMenuOptionBuilder, Events, WebhookClient } = require("discord.js");
const Logger = require("./utils/log");
const cron = require("cron");
const dotenv = require("dotenv");
const got = require("got");
dotenv.config();
const Discord = require('discord.js');
const fs = require('fs');
const path = require('node:path');
const USERID = require("./UserIDs.js");
global.prefix = '>';
global.SnowflakeID = [];
global.SexID = 0;
global.SexCount = 0;
global.CmdEnabled = 1;

client = new Client({ intents: Object.keys(GatewayIntentBits) });
const logger = new Logger({root: __dirname, client});

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
       logger.warning(`The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

const commandFiles = fs.readdirSync('./Commands/').filter(file => file.endsWith('.js'));
for (const file of commandFiles) {
    const command = require(`./Commands/${file}`);

    client.commands.set(command.name, command)
}
/*
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Shows bot latency'),
    async execute(interaction, client) {

        },
    };
*/

client.on("ready", () => {

    logger.info("Bot starting...");

    client.user.setActivity(`>help | Time to be annoying!`);

    //Allah everyday at 2:22
    let scheduledMessage = new cron.CronJob('30 59 02 * * *', () => {
        // This runs every day at 02:56:30
        client.channels.cache.get("1069811223950016572").send("- - - - - New Day - - - - -");
    });
    //sarting the daily sending
    scheduledMessage.start()

    //start confirmation
    setTimeout(function () {
        client.channels.cache.get("1037141235451842701").send(`Bot Online!, **Ping**: \`${client.ws.ping}ms\``);
        logger.info("Bot started successfully.");
    }, 1000 * 0.1)


})

client.on('guildMemberAdd', member => {
    logger.info(`${member.user.tag} (${member.id}) joined \`${member.guild.name}\``)
    client.channels.cache.get("1048076076653486090").send(`${member.user.tag} (<@${member.id}>) joined \`${member.guild.name}\``);
})

client.on('guildMemberRemove', member => {
    logger.info(`${member.user.tag} (${member.id}) left \`${member.guild.name}\``)
    client.channels.cache.get("1048076076653486090").send(`${member.user.tag} (<@${member.id}>) left \`${member.guild.name}\``);
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
        await slash.execute(logger, interaction, client);
    } catch (error) {
        console.error(`Error executing ${interaction.commandName}`);
        console.error(error);
    }
});

client.on("messageCreate", (message) => {
    if (message.author.bot) return;
    //if (message.webhookId) return;

    if (message.content.toLowerCase() == `>disable` && message.author.id == USERID.itsmaat) {
        CmdEnabled = 0;
        message.reply("Responses disabled.");
    } else if (message.content.toLowerCase() == `>enable` && message.author.id == USERID.itsmaat) {
        CmdEnabled = 1;
        message.reply("Responses enabled.");
    } else if (message.content.toLowerCase() == `>disable` || message.content.toLowerCase() == `>enable` && !message.author.id == USERID.itsmaat) {
        message.reply(`You are not allowed to execute that command`);
    }

    if (message.content.startsWith(prefix)) {

        const args = message.content.slice(prefix.length).split(/ +/);
        const command = args.shift().toLowerCase();

        // If command does not exist, return
        if (!client.commands.get(command)) {
            return;
        }

        client.commands.get(command).execute(logger, client, message, args)

    }

    if (message.content == "<@1036485458827415633>") {
        message.reply(`**Prefix** : ${prefix}\n**Help command** : ${prefix}help`);
    }

    if (CmdEnabled == 1) {

        //reacts :sick: when gros gaming or smartass is said
        if (message.content.toLowerCase().includes("gros gaming") || message.content.toLowerCase().includes("smartass") || (message.content.toLowerCase().includes("edging") && !message.author.id == USERID.dada129)) {
            message.react('🇸')
                .then(() => message.react('🇹'))
                .then(() => message.react('🇫'))
                .then(() => message.react('🇺'));
        }

        if (message.content.toLowerCase().includes("edging") && message.author.id == USERID.dada129) {
            message.delete()
        }

        //what? eveeeer
        if (message.content.toLowerCase() == `what` || message.content == `what?` || message.content == `What?` ||
            message.content.toLowerCase() == `who` || message.content == `who?` || message.content == `Who?`) {
            message.reply("ever!")
        }

        //ever what?
        if (message.content.toLowerCase() == `ever`) {
            message.reply("What?")
        }

        //Sex count with ID
        if (message.content.toLowerCase() == `sex` && message.author.id == SexID) {
            message.reply(`Dude this is the ${SexCount}th time you said that, please shut up`)
            SexCount += 1;
        }

        //skull reaction to skull emoji
        if (message.content.toLowerCase() == `💀`) {
            message.react('💀')
        }

        //Snowflake reaction
        if (SnowflakeID != 0 && SnowflakeID.some(element => message.author.id.includes(element))) {
            message.react('❄️');
        }

        //reacts :gorilla: when pinging iTsMaaT
        if (message.content.includes("<@411996978583699456>")) {
            message.react('🦍')
        }

        //reacts :chipmunk: when pinging phildiop
        if (message.content.includes("<@348281625173295114>")) {
            message.react('🐿️')
        }

        //answers your mom when asking who's at break
        if (message.content.toLowerCase().includes("en pause")) {
            message.channel.send("Ta mère")
        }

        //Ping fail if doesnt have @everyone perm
        if (!message.member.permissions.has("MentionEveryone") && (message.content.includes("@everyone") || message.content.includes("@here"))) {
            message.reply("Ping fail L");
        }

        //answers bruh to bruh
        if (message.content.toLowerCase() == "bruh") {
            message.reply("bruh")
        }

        if (message.content.toLowerCase().includes("stuff")) {
            message.reply("https://media.discordapp.net/attachments/774305852323790873/1040424470483046462/8fa.png?width=628&height=670")
        }

        if (message.content.toLowerCase() == "sus" || message.content.toLowerCase() == "amogus" || message.content.toLowerCase() == "among us") {
            //message.reply("No.");
        }

        if (message.attachments.size > 0 || message.content.startsWith("https://") || message.content.startsWith("http://")) {
            if (message.channel.name.includes('meme')) {
                message.react('👍')
                    .then(() => message.react('👎'))
                    .then(() => message.react('♻️'));
            }
        }

        if (message.content.toLowerCase() == "sex") {

            fetchFurry().then(embed => {
                message.author.send({ embeds: [embed] })
                logger.info(`${message.member.user.tag} said sex, he therefore received \`${furryImage}\``)
                .catch(() => {
                    logger.error(`Unable to send private message to ${message.member.user.tag}`);
               });
            });
        }
    }
})
client.login(process.env.TOKEN);

const fetchFurry = async () => {
    let furryImage = "";
    const embed = new EmbedBuilder()
    while (!furryImage.startsWith("https://i.redd.it")) {
        let response = await got('https://www.reddit.com/r/yiff/random/.json');
        //FurryPornSubreddit
        //rule34.xxx/index.php?page=post&s=random
        let content = JSON.parse(response.body);
        let permalink = content[0].data.children[0].data.permalink;
        let furryUrl = `https://reddit.com${permalink}`;
        furryImage = content[0].data.children[0].data.url;
    }
    logger.info(furryImage);
    embed.setImage(furryImage);
    return embed, furryImage;
}
