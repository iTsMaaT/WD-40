const { PrismaClient } = require("@prisma/client");
const { Client, GatewayIntentBits, Events, Partials } = require("discord.js");
const { activities, blacklist, whitelist, DefaultSuperuserState, DefaultDebugState } = require("./utils/config.json");

require('module-alias/register');

const Logger = require("./utils/log");
const fs = require('fs');

const cron = require("cron");
const dotenv = require("dotenv");
const Discord = require('discord.js');

const getExactDate = require("@functions/getExactDate");
const GetPterodactylInfo = require("@functions/GetPterodactylInfo");
const SendErrorEmbed = require("@functions/SendErrorEmbed");

var HourlyRam = [0, 0, 0];

dotenv.config();

const client = new Client({
    intents: Object.keys(GatewayIntentBits), // all intents
    partials: Object.keys(Partials),
    shards: "auto",
    allowedMentions: { repliedUser: false }
});

global.prisma = new PrismaClient();
global.GuildManager = (require("./utils/GuildManager.js"))(prisma);
global.prefix = '>';
global.CmdEnabled = 1;
global.superuser = 0;
global.debug = 1;
global.SmartRestartEnabled = 0;

// Add array.equals()
Array.prototype.equals = function (b) {
    return this.length == b.length && this.every((v, i) => v === b[i]);
};

//music
const { Player } = require('discord-player');
global.player = new Player(client);
player.extractors.loadDefault();

//Logger system and databases
global.logger = new Logger({ root: __dirname, client });
global.snowflakeData = [];
prisma.snowflake.findMany().then(v => {
    const result = v.map(v => [parseInt(v.GuildID), parseInt(v.UserID)]);
    global.snowflakeData = global.snowflakeData.concat(result);
});

//Error handler
//Gotta Catch ’Em All!
process.on("unhandledRejection", (err) => {
    if (err.code === 10008) return logger.error(err.stack);
    logger.error(err.stack);
    client?.channels?.cache?.get("1037141235451842701")?.send(`Error caught <@411996978583699456>! <#1069811223950016572>`);
});


//Collections creation
client.commands = new Discord.Collection();
client.slashcommands = new Discord.Collection();
client.contextCommands = new Discord.Collection();
client.events = new Discord.Collection();
const cooldowns = new Map();

//File finder/loader
function loadFiles(folder, callback) {
    const commandFiles = fs.readdirSync(folder);
    while (commandFiles.length > 0) {
        const file = commandFiles.shift();
        if (file.endsWith('.js')) {
            const loaded = require(`${folder}${file}`);
            loaded.filePath = folder + file;
            callback(loaded, file);
        } else {
            const newFiles = fs.readdirSync(folder + file);
            newFiles.forEach(f => commandFiles.push(file + '/' + f));
        }
    }
}

//Slash command handler
const discoveredCommands = [];
loadFiles('./Commands/slash/', (slashcommand, fileName) => {
    if ('name' in slashcommand && 'execute' in slashcommand && 'description' in slashcommand) {
        client.slashcommands.set(slashcommand.name, slashcommand);
        discoveredCommands.push(slashcommand);
    } else {
        logger.error(`[WARNING] The (/) command ${fileName} is missing a required "name", "execute", or "type" property.`);
    }
});

//Text command handler
loadFiles('./Commands/text/', function (command) {
    client.commands.set(command.name, command);

    if (command.aliases && Array.isArray(command.aliases)) {
        command.aliases.forEach(alias => {
            client.commands.set(alias, command);
        });
    }
});

// Context menu command handler
loadFiles('./Commands/context/', (contextcommand, fileName) => {
    if ('name' in contextcommand && 'execute' in contextcommand && 'type' in contextcommand) {
        client.contextCommands.set(contextcommand.name, contextcommand);
        discoveredCommands.push(contextcommand);
    } else {
        logger.error(`[WARNING] The (ctx) command ${fileName} is missing a required "name", "execute", or "type" property.`);
    }
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

    console.log("Guild manager initiation...");
    const guilds = await client.guilds.fetch();
    await global.GuildManager.init(guilds);
    console.log("Guild manager initiation done.");

    console.log("Setting up slash commands...");
    await client.application.commands.set(discoveredCommands);
    console.log("Slash command setup done.");

    console.log("Setting up activity status...");
    activities[7] = activities[7].replace("Placeholder01", (100 / activities.length).toFixed(2));
    activities[8] = activities[8].replace("Placeholder02", activities.length - 1);
    client.user.setActivity(activities[Math.floor(Math.random() * activities.length)]);
    console.log("Activity status setup done.");

    console.log("Creating the cron jobs...");
    //- - - New Day - - -
    const scheduledMessage = new cron.CronJob('30 59 02 * * *', () => {
        // This runs every day at 02:59:30
        client.channels.cache.get("1069811223950016572").send("- - - - - New Day - - - - -");
    });

    const DailyActivity = new cron.CronJob('00 00 04 * * *', () => {
        client.user.setActivity(activities[Math.floor(Math.random() * activities.length)]);
    });

    const RamLeakDetector = new cron.CronJob('0 * * * *', async () => {
        try {
            const PterodactylInfo = await GetPterodactylInfo();
            let RamLeakPourcentage = parseInt(PterodactylInfo.ram.pourcentage.raw).toFixed(0);
            if (RamLeakPourcentage > 100) RamLeakPourcentage = 100;
            console.log(`Current RAM usage: ${RamLeakPourcentage}%`);
            HourlyRam.push(RamLeakPourcentage);
            HourlyRam.shift();
            console.log(HourlyRam);
            if (HourlyRam[0] > 90 && HourlyRam[1] > 90 && HourlyRam [2] > 90) client.users.cache.get(process.env.OWNER_ID).send("Memory leak detected.");
        } catch(err) {
            logger.error("Couldn't get the RAM % for MemoryLeakDetector");
            logger.error(err);
        }
    });

    const SmartRestart = new cron.CronJob('* * * * *', async () => {
        if (SmartRestartEnabled) {
            if (Array.from(client.voice.adapters.keys()).length == 0) {
                logger.severe(`Restart requested from discord`);
                client.channels.cache.get("1037141235451842701").send(`Restart requested from discord for reason : \`Smart restart\``);

                //After 3s, closes the database and then exits the process
                setTimeout(function () {
                /****************/
                    global.prisma.$disconnect();
                    process.exit(1);
                /****************/
                }, 1000 * 3);
            }
        }
    });

    console.log("Starting the cron jobs...");
    //sarting the daily sending
    scheduledMessage.start();
    DailyActivity.start();
    RamLeakDetector.start();
    SmartRestart.start();
    console.log("Cron job setup done.");
    console.log("Discord.js version: " + require('discord.js').version);
    console.log(`There is ${client.options.shardCount} shard${client.options.shardCount > 1 ? "s" : ""} spawned`);
    global.debug = DefaultDebugState;
    global.superuser = DefaultSuperuserState;
    if (process.env.SERVER == "dev") global.superuser = 1;
    console.log(`Debug is ${debug ? "en" : "dis"}abled\nSuperuser is ${superuser ? "en" : "dis"}abled`);

    //start confirmation
    logger.info("Bot started successfully.");
    const interval = setInterval(() => {
        if (client.ws.ping !== -1) {
            client.channels.cache.get("1037141235451842701").send(`Bot Online!, **Ping**: \`${client.ws.ping}ms\``);
            clearInterval(interval);
        }
    }, 500);
    client.user.setActivity(activities[Math.floor(Math.random() * activities.length)]);
});

//Debug event
client.on('debug', debug => {
    if (global.debug) console.log(debug);
});

//Slash command executing
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {

        const slash = interaction.client.slashcommands.get(interaction.commandName);

        if (!slash) return console.error(`No command matching ${interaction.commandName} was found.`);

        try {
        //execute the slash command
            await slash.execute(logger, interaction, client);
            //Logging the command
            logger.info(`Executing [/${interaction.commandName}]\nby    [${interaction.user.tag} (${interaction.user.id})]\nin    [${interaction.channel.name} (${interaction.channel.id})]\nfrom  [${interaction.guild.name} (${interaction.guild.id})]`);
        } catch (error) {
            logger.error(`Error executing slash command [${interaction.commandName}]`);
            logger.error(error);
        }
    } else if (interaction.isContextMenuCommand()) {
        
        const context = client.contextCommands.get(interaction.commandName);

        if (!context) return console.error(`No command matching ${interaction.commandName} was found.`);

        try {
            await context.execute(logger, interaction, client);
            logger.info(`Executing [${interaction.commandName} (${context.type === 2 ? "User" : "Message"})]\nby    [${interaction.user.tag} (${interaction.user.id})]\nin    [${interaction.channel.name} (${interaction.channel.id})]\nfrom  [${interaction.guild.name} (${interaction.guild.id})]`);
        } catch (error) {
            logger.error(`Error executing context menu command [${interaction.commandName}]`);
            logger.error(error);
        }
    }
});

//Text command executing
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    if (superuser && (message.author.id != process.env.OWNER_ID && whitelist.includes(message.author.id))) return;
    if (!message.guild) return;
    if (blacklist.includes(message.author.id)) return;

    try {
        await global.prisma.message.create({
            data: {
                MessageID: message.id,
                UserID: message.author.id,
                UserName: message.member.user.tag,
                ChannelID: message.channel.id,
                ChannelName: message.channel.name,
                GuildID: message.guild.id,
                GuildName: message.guild.name,
                //Timestamp: new Date(new Date(message.createdTimestamp).toLocaleString("en-US", {timeZone: "America/Toronto"})),
                Content: message.content,
            }
        });
    } catch (ex) {
        console.log(`[${getExactDate()} - SEVERE] Unable to write to database`);
        console.log(ex);
    }

    //Text command executing
    const prefix = global.GuildManager.GetPrefix(message.guild);
    if (message.content.startsWith(prefix) || message.content.startsWith(`<@${client.user.id}>`)) {
        let args, commandName;
        if (!message.content.startsWith(`<@${client.user.id}> `)) {
            args = message.content.slice(prefix.length).split(/ +/);
            commandName = args.shift().toLowerCase();
        } else {
            args = message.content.slice().split(/ +/);
            args.shift();
            commandName = args.shift().toLowerCase();
        }

        // Check if the command or alias exists
        const command = client.commands.get(commandName);
        if (!command) return;
        if (command.admin && !message.member.permissions.has("Administrator") || !message.author.id == process.env.OWNER_ID) return SendErrorEmbed(message, "You are not administrator", "red");

        const blacklist = await GuildManager.GetBlacklist(message.guild.id);
        const blCategory = !blacklist.CheckPermission(message.author.id, command.category);
        const blCommand = !blacklist.CheckPermission(message.author.id, command.name);
        if(blCategory || blCommand){
            return SendErrorEmbed(message, `You are blacklisted from executing ${!blCategory ? `commands in the **${command.category}** category` : `the **${command.name}** command`}.`, "red");
        }

        // Check command cooldown
        if (cooldowns.has(message.author.id)) {
            const cooldown = cooldowns.get(message.author.id);
            const timeLeft = cooldown - Date.now();
            if (timeLeft > 0) {
                message.reply(`Please wait ${Math.ceil(timeLeft / 1000)} seconds before using that command again.`);
                return;
            }
        }

        // Set command cooldown
        const cooldownTime = command.cooldown || 0;
        cooldowns.set(message.author.id, Date.now() + cooldownTime);

        // Logging every executed commands
        logger.info(`Executing [${message.content}]\nby    [${message.member.user.tag} (${message.author.id})]\nin    [${message.channel.name} (${message.channel.id})]\nfrom  [${message.guild.name} (${message.guild.id})]`);

        // Execute the command
        try {
            message.channel.sendTyping();
            await command.execute(logger, client, message, args);
        } catch (error) {
            logger.error(error.stack);
            return SendErrorEmbed(message, "An error occured while executing the command", "red");
        }
    }
});
//Logins with the token
client.login(process.env.TOKEN);