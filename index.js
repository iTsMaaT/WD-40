const { PrismaClient } = require("@prisma/client");
const { Client, Intents, GatewayIntentBits, EmbedBuilder, PermissionsBitField, SelectMenuOptionBuilder, Events, WebhookClient, Partials } = require("discord.js");
const { Guild } = require("discord.js");
const { DisTube } = require('distube');

const Logger = require("./utils/log");
const SaveFile = require("./utils/save_file");
const fs = require('fs');

const cron = require("cron");
const dotenv = require("dotenv");
const got = require("got");
const Discord = require('discord.js');
const path = require('node:path');
const USERID = require("./UserIDs.js");

const GiftTime = 4;

dotenv.config();

const client = new Client({
    intents: Object.keys(GatewayIntentBits), // all intents
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

global.prisma = new PrismaClient();
global.GuildManager = (require("./utils/GuildManager.js"))(prisma);
global.prefix = '>';
global.CmdEnabled = 1;
global.superuser = 0;
global.Blacklist = {};

const FetchReddit = require("./utils/functions/FetchReddit.js");

// Add array.equals()
Array.prototype.equals = function (b) {
    return this.length == b.length && this.every((v, i) => v === b[i]);
}

//Music 
const ffmpeg = require('ffmpeg');
const { YtDlpPlugin } = require('@distube/yt-dlp');
const { SpotifyPlugin } = require('@distube/spotify');
const GuildManager = require("./utils/GuildManager.js");
client.distube = new DisTube(client, {
    leaveOnStop: false,
    leaveOnFinish: true,
    emptyCooldown: 30,
    emitNewSongOnly: true,
    emitAddSongWhenCreatingQueue: true,
    emitAddListWhenCreatingQueue: true,
    nsfw: true,
    youtubeCookie: process.env.YOUTUBECOOKIE,
    plugins: [
        new SpotifyPlugin({
            emitEventsAfterFetching: true,
            parallel: true
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


//Collections creation
client.commands = new Discord.Collection();
client.slashcommands = new Discord.Collection();
client.events = new Discord.Collection();

//File finder/loader
function loadFiles(folder, callback) {
    const commandFiles = fs.readdirSync(folder);
    while (commandFiles.length > 0) {
        let file = commandFiles.shift();
        if (file.endsWith('.js')) {
            const loaded = require(`${folder}${file}`);
            callback(loaded, file);
        } else {
            let newFiles = fs.readdirSync(folder + file);
            newFiles.forEach(f => commandFiles.push(file + '/' + f));
        }
    }
}

//Slash command handler
let discoveredCommands = [];
loadFiles('./slash/', (slashcommand, fileName) => {
    if ('name' in slashcommand && 'execute' in slashcommand && 'description' in slashcommand) {
        client.slashcommands.set(slashcommand.name, slashcommand);
        discoveredCommands.push(slashcommand);
    } else {
        logger.error(`[WARNING] The command ${fileName} is missing a required "data" or "execute" property.`);
    }
});

//Text command handler
loadFiles('./Commands/', function (command) {
    client.commands.set(command.name, command)
});

//Event handler
loadFiles('./events/', function (event) {
    if (event.once) {
        client.once(event.name, (...args) => event.execute(client, logger, ...args));
    } else {
        client.on(event.name, (...args) => event.execute(client, logger, ...args));
    }
});

//Bot setup on startup
client.on("ready", async () => {

    logger.info(`Bot starting on [${process.env.SERVER}]...`);

    console.log("Guild manager initiation...")
    let guilds = await client.guilds.fetch();
    await global.GuildManager.init(guilds);
    console.log("Guild manager initiation done.")

    console.log("Setting up slash commands...")
    await client.application.commands.set(discoveredCommands);
    console.log("Slash command setup done.")

    console.log("Setting up activity status...")
    client.user.setActivity(`>help | Time to be annoying!`);
    console.log("Activity status setup done.")

    console.log("Creating the cron jobs...")
    //- - - New Day - - -
    let scheduledMessage = new cron.CronJob('30 59 02 * * *', () => {
        // This runs every day at 02:59:30
        client.channels.cache.get("1069811223950016572").send("- - - - - New Day - - - - -");
    });

    let AiryBadgeGift = new cron.CronJob(`00 30 ${GiftTime} * * *`, async () => {
        if (Math.floor(Math.random() * 100) >= 5) {
            client.users.cache.get("529130880250413068").send({ content: "Daily gift, enjoy ;)", embeds: [await FetchReddit(message, true, "furrypornsubreddit", "yiff", "furryonhuman")] });
        } else {
            client.users.cache.get("529130880250413068").send("https://cdn.discordapp.com/attachments/529140437089386497/1107828639254462484/803652eeef9cde7ec4e448744706cbf2d6d2d04201a60fd190d68940e45caf4f_1.png")
        }
        GiftTime = Math.floor(Math.random() * 24);
    });

    console.log("Starting the cron jobs...")
    //sarting the daily sending
    scheduledMessage.start();
    AiryBadgeGift.start();
    console.log("Cron job setup done.")

    //start confirmation
    setTimeout(function () {
        client.channels.cache.get("1037141235451842701").send(`Bot Online!, **Ping**: \`${client.ws.ping}ms\``);
        logger.info("Bot started successfully.");
    }, 2000 * 0.1);
});

/*
//Debug event
client.on('debug', debug => {
    console.log(debug);
});
*/

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
        //Logging the command
        logger.info(`Executing [/${interaction.commandName}]\nby    [${interaction.user.tag} (${interaction.user.id})]\nin    [${interaction.channel.name} (${interaction.channel.id})]\nfrom  [${interaction.guild.name} (${interaction.guild.id})]`);
    } catch (error) {
        console.error(`Error executing ${interaction.commandName}`);
        console.error(error);
    }
});

//Text command executing
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


})

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
    .on('empty', queue => {
        const empty_embed = new EmbedBuilder()
            .setColor('#ffffff')
            .setDescription('Voice channel is empty! Leaving the channel...')
            .setTimestamp()
        queue.textChannel.send({ embeds: [empty_embed] })
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

//Logins with the token
client.login(process.env.TOKEN);