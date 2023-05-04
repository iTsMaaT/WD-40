const { PrismaClient } = require("@prisma/client");
const { Client, Intents, GatewayIntentBits, EmbedBuilder, PermissionsBitField, SelectMenuOptionBuilder, Events, WebhookClient, Partials } = require("discord.js");
const Logger = require("./utils/log");
const SaveFile = require("./utils/save_file");
const cron = require("cron");
const dotenv = require("dotenv");
const got = require("got");
const { DisTube } = require('distube');
dotenv.config();
const Discord = require('discord.js');
const { Guild } = require("discord.js");
const fs = require('fs');
const path = require('node:path');
const USERID = require("./UserIDs.js");
const client = new Client({
    intents: Object.keys(GatewayIntentBits), // all intents
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});
global.prisma = new PrismaClient();
global.GuildManager = (require("./utils/GuildManager.js"))(prisma);
global.prefix = '>';
global.SnowflakeID = [];
global.CmdEnabled = 1;
global.superuser = 0;
global.BaseActivityStatus = ">help | Time to be annoying!"
global.Blacklist = {};

const FetchReddit = require("./utils/functions/FetchReddit.js");

// Add array.equals()
Array.prototype.equals = function (b) {
    return this.length == b.length && this.every((v, i) => v === b[i]);
}

const ffmpeg = require('ffmpeg');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const { SpotifyPlugin } = require('@distube/spotify');
const UserIDs = require("./UserIDs.js");
const GuildManager = require("./utils/GuildManager.js");
client.distube = new DisTube(client, {
    leaveOnStop: false,
    leaveOnFinish: true,
    emptyCooldown: 30,
    emitNewSongOnly: true,
    emitAddSongWhenCreatingQueue: false,
    emitAddListWhenCreatingQueue: false,
    nsfw: true,
    youtubeCookie: process.env.YOUTUBECOOKIE,
    plugins: [
        new SpotifyPlugin({
            emitEventsAfterFetching: true
        }),
        new YtDlpPlugin()
    ]
})

//Logger system and databases
global.logger = new Logger({ root: __dirname, client });
global.snowflakeData = [];
prisma.snowflake.findMany().then(v => {
    let result = v.map(v => [parseInt(v.GuildID), parseInt(v.UserID)]);
    global.snowflakeData = global.snowflakeData.concat(result);
});

//Error handler
process.on("uncaughtException", (err) => {
    logger.error(err.stack);
    client?.channels?.cache?.get("1037141235451842701")?.send(`Error caught <@411996978583699456>! <#1069811223950016572>`);
});

//create a collection for text commands
client.commands = new Discord.Collection();
//create a collection for slash commands
client.slashcommands = new Discord.Collection();

//Slash command finder
const slashcommandsPath = path.join(__dirname, 'slash');
const slashcommandFiles = fs.readdirSync(slashcommandsPath).filter(file => file.endsWith('.js'));


//Slash command handler
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

//Text command handler
const commandFiles = fs.readdirSync('./Commands/');
while (commandFiles.length > 0) {
    let file = commandFiles.shift();
    if (file.endsWith('.js')) {
        const command = require(`./Commands/${file}`);
        client.commands.set(command.name, command)
    } else {
        let newFiles = fs.readdirSync('./Commands/' + file);
        newFiles.forEach(f => commandFiles.push(file + '/' + f));
    }
}

//Bot setup on startup
client.on("ready", async () => {

    logger.info("Bot starting...");

    let guilds = await client.guilds.fetch();
    await global.GuildManager.init(guilds);

    client.user.setActivity(`>help | Time to be annoying!`);

    //- - - New Day - - -
    let scheduledMessage = new cron.CronJob('30 59 02 * * *', () => {
        // This runs every day at 02:59:30
        client.channels.cache.get("1069811223950016572").send("- - - - - New Day - - - - -");
    });
    //sarting the daily sending
    scheduledMessage.start();

    //start confirmation
    setTimeout(function () {
        client.channels.cache.get("1037141235451842701").send(`Bot Online!, **Ping**: \`${client.ws.ping}ms\``);
        logger.info("Bot started successfully.");
    }, 2000 * 0.1);
});

//Member join and leave logging
client.on('guildMemberAdd', member => {
    logger.info(`${member.user.tag} (${member.id}) joined \`${member.guild.name}\``)
    client.channels.cache.get("1048076076653486090").send(`${member.user.tag} (<@${member.id}>) joined \`${member.guild.name}\``);
});
client.on('guildMemberRemove', member => {
    logger.info(`${member.user.tag} (${member.id}) left \`${member.guild.name}\``)
    client.channels.cache.get("1048076076653486090").send(`${member.user.tag} (<@${member.id}>) left \`${member.guild.name}\``);
});

//Bot join and leave logging
client.on('guildCreate', async (guild) => {
    await GuildManager.SetActiveOrCreate(guild);
    logger.info(`The bot has been added to \`${guild.name}\``)
    client.channels.cache.get("1048076076653486090").send(`The bot has been added to \`${guild.name}\``);
});

client.on('guildDelete', async (guild) => {
    await GuildManager.SetActiveOrCreate(guild, false);
    logger.info(`The bot has been removed from \`${guild.name}\``)
    client.channels.cache.get("1048076076653486090").send(`The bot has been removed from \`${guild.name}\``);
});

/*
//Debug event
client.on('debug', debug => {
    console.log(debug);
});
*/

//Guild unavailability (outage)
client.on('guildUnavailable', (guild) => {
    logger.severe(`A guild is unavailable, likely because of a server outage: ${guild}`);
});

//Restarting the bot when it becomes invalidated
client.on('invalidated', () => {
    logger.severe("The client was invalidated, restarting the bot...");
    setTimeout(function () {
        global.prisma.$disconnect();
        process.exit(1);
    }, 1000 * 3)
});

//Warning if rate-limited
client.on('rateLimit', (rateLimitData) => {
    logger.warning(`The bot is rate-limited: ${rateLimitData}`);
});

//Warning info
client.on('warn', (info) => {
    logger.warning(`Warning: ${info}`);
});

//Slash command executing
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

client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (superuser && message.author.id != USERID.itsmaat) return;
    if (!message.guild) return;
    if (Blacklist[message.author.id]) return;
    if (global.GuildManager.GetResponses(message.guild)) {

        //Sends furry porn in DMs of anyone that says "sex"
        if (message.content.toLowerCase() == "sex") {
            message.author.send({ embeds: [await FetchReddit(message, "furrypornsubreddit", "yiff", "furryonhuman")] })

        }
    }
})

client.on("messageCreate", (message) => {
    if (message.author.bot) return;
    if (superuser && message.author.id != USERID.itsmaat) return;
    if (!message.guild) return;
    if (Blacklist[message.author.id]) return;

    //Text command executing
    let prefix = global.GuildManager.GetPrefix(message.guild)
    if (message.content.startsWith(prefix)) {

        const args = message.content.slice(prefix.length).split(/ +/);
        const command = args.shift().toLowerCase();

        // If command does not exist, return
        if (!client.commands.get(command)) {
            return;
        }

        //Logging every executed commands

        logger.info(`Executing [${message.content}]\nby    [${message.member.user.tag} (${message.author.id})]\nin    [${message.channel.name} (${message.channel.id})]\nfrom  [${message.guild.name} (${message.guild.id})]`);
        client.commands.get(command).execute(logger, client, message, args);
    }

    //Gives the prefix if the bot is pinged
    if (message.content == "<@1036485458827415633>") {
        message.reply(`**Prefix** : ${prefix}\n**Help command** : ${prefix}help`);
    }

    //Votes for the memes
    if (message.attachments.size > 0 || message.content.startsWith("https://") || message.content.startsWith("http://")) {
        if (message.channel.name.includes('meme')) {
            message.react('👍')
                .then(() => message.react('👎'))
                .then(() => message.react('♻️'))
                .then(() => message.react('💀'))
                .then(() => message.react('🤨'))
                .then(() => message.react("😎"));
        }
    }

    //Auto-responses
    if (global.GuildManager.GetResponses(message.guild)) {

        //reacts S-T-F-U when gros gaming or smartass is said
        if (message.content.toLowerCase().includes("gros gaming") || message.content.toLowerCase().includes("smartass") || (message.content.toLowerCase().includes("edging") && !message.author.id == USERID.dada129)) {
            message.react('🇸')
                .then(() => message.react('🇹'))
                .then(() => message.react('🇫'))
                .then(() => message.react('🇺'));
        }

        //Deletes the message if it has edging and is said by dada
        if (message.content.toLowerCase().includes("edging") && message.author.id == USERID.dada129) {
            message.delete();
        }

        //what? eveeeer
        if (message.content.toLowerCase() == `what` || message.content == `what?` || message.content == `What?` ||
            message.content.toLowerCase() == `who` || message.content == `who?` || message.content == `Who?`) {
            message.reply("ever!");
        }

        //ever what?
        if (message.content.toLowerCase() == `ever`) {
            message.reply("What?");
        }

        //skull reaction to skull emoji
        if (message.content.toLowerCase() == `💀`) {
            message.react('💀');
        }

        //Snowflake reaction
        if (snowflakeData != []) {
            let expected = [parseInt(message.guildId), parseInt(message.author.id)];
            let exists = snowflakeData.filter(v => {
                return v.equals(expected);
            }).length >= 1;
            if (exists) {
                message.react('❄️');
            }
        }

        //reacts :gorilla: when pinging iTsMaaT
        if (message.content.includes("<@411996978583699456>")) {
            message.react('🦍');
        }

        //reacts :chipmunk: when pinging phildiop
        if (message.content.includes("<@348281625173295114>")) {
            message.react('🐿️');
        }

        //answers your mom when asking who's at break
        if (message.content.toLowerCase().includes("en pause")) {
            message.channel.send("Ta mère");
        }

        //Ping fail if doesnt have @everyone perm
        if (message.member && !message.member.permissions.has("MentionEveryone") && (message.content.includes("@everyone") || message.content.includes("@here"))) {
            message.reply("Ping fail L");
        }

        //answers bruh to bruh
        if (message.content.toLowerCase() == "bruh") {
            message.reply("bruh");
        }

        //Reacts the stuff meme when a message includes "stuff"
        if (message.content.toLowerCase().includes("stuff")) {
            message.react("<:stuff:1099738190966960179>");
        }

        //Replies when someone does a mogus reference
        if (message.content.toLowerCase() == "sus" || message.content.toLowerCase() == "amogus" || message.content.toLowerCase() == "among us") {
            //message.reply("No.");
        }
    }
})
//Logins with the token
client.login(process.env.TOKEN);


const status = queue => `Volume: \`${queue.volume}%\` | Filter: \`${queue.filters.names.join(', ') || 'Off'}\` | Loop: \`${queue.repeatMode ? (queue.repeatMode === 2 ? 'All Queue' : 'This Song') : 'Off'}\` | Autoplay: \`${queue.autoplay ? 'On' : 'Off'}\``

client.distube

    .on('playSong', (queue, song) => {
        const playsong_embed = new EmbedBuilder()
            .setColor('#ffffff')
            .setDescription(`Playing \`${song.name}\` - \`${song.formattedDuration}\`\nRequested by: ${song.user}\n${status(queue)}`)
            .setTimestamp()
        queue.textChannel.send({ embeds: [playsong_embed] })
    })
    .on('addSong', (queue, song) => {
        const addsong_embed = new EmbedBuilder()
            .setColor('#ffffff')
            .setDescription(`Added ${song.name} - \`${song.formattedDuration}\` to the queue by ${song.user}`)
            .setTimestamp()
        queue.textChannel.send({ embeds: [addsong_embed] })
    })
    .on('addList', (queue, playlist) => {
        const addlist_embed = new EmbedBuilder()
            .setColor('#ffffff')
            .setDescription(`Added \`${playlist.name}\` playlist (${playlist.songs.length} songs) to queue\n${status(queue)}`)
            .setTimestamp()
        queue.textChannel.send({ embeds: [addlist_embed] })
    })
    .on('error', (channel, e) => {
        const error_embed = new EmbedBuilder()
            .setColor('#ffffff')
            .setDescription(`An error encountered: ${e.toString().slice(0, 1974)}`)
            .setTimestamp()
        if (channel) channel.send({ embeds: [error_embed] })
        else console.error(e)
    })
    .on('empty', channel => {
        const empty_embed = new EmbedBuilder()
            .setColor('#ffffff')
            .setDescription('Voice channel is empty! Leaving the channel...')
            .setTimestamp()
        channel.send({ embeds: [empty_embed] })
    })
    .on('searchNoResult', (message, query) => {
        const no_result_embed = new EmbedBuilder()
            .setColor('#ffffff')
            .setDescription(`No result found for \`${query}\`!`)
            .setTimestamp()
        message.channel.send({ embeds: [no_result_embed] })
    })
    .on('finish', queue => {
        const finished_embed = new EmbedBuilder()
            .setColor('#ffffff')
            .setDescription("Finished!")
            .setTimestamp()
        queue.textChannel.send({ embeds: [finished_embed] })
    })
