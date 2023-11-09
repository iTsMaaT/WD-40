const { PrismaClient } = require("@prisma/client");
const { Client, GatewayIntentBits, Events, Partials, ActivityType, PermissionFlagsBits } = require("discord.js");
const { activities, blacklist, whitelist, DefaultSuperuserState, DefaultDebugState, AutoCommandMatch } = require("./utils/config.json");

require("module-alias/register");

const Logger = require("./utils/log");
const fs = require("fs");

const cron = require("cron");
const dotenv = require("dotenv");
const Discord = require("discord.js");

const getExactDate = require("@functions/getExactDate");
const GetPterodactylInfo = require("@functions/GetPterodactylInfo");
const { SendErrorEmbed } = require("@functions/discordFunctions");
const RandomMinMax = require("@functions/RandomMinMax");
const findClosestMatch = require("@functions/findClosestMatch");
const HourlyRam = [0, 0, 0];

dotenv.config();

const client = new Client({
    intents: Object.keys(GatewayIntentBits), // all intents
    partials: Object.keys(Partials),
    shards: "auto",
    allowedMentions: { repliedUser: false },
});

global.prisma = new PrismaClient();
global.GuildManager = (require("./utils/GuildManager.js"))(global.prisma);
global.superuser = 0;
global.debug = 1;
global.SmartRestartEnabled = 0;

// Add array.equals()
Array.prototype.equals = function(otherArray) {
    return this.length === otherArray.length && this.every((value, index) => value === otherArray[index]);
};

// Add array.shuffle
Array.prototype.shuffle = function() {
    for (let i = this.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this[i], this[j]] = [this[j], this[i]];
    }
    return this;
};

// music
const { Player } = require("discord-player");
global.player = new Player(client, {
    ytdlOptions: {
        requestOptions: {
            headers: {
                cookie: process.env.YOUTUBE_COOKIE,
                "x-youtube-identity-token": process.env.YOUTUBE_TOKEN,
            },
        },
    },
});
global.player.extractors.loadDefault();

// Logger system and databases
global.logger = new Logger({ root: __dirname, client });
console.logger = console.log;
console.log = (log) => global.logger.console(log);
global.snowflakeData = [];
prisma.snowflake.findMany().then(val => {
    const result = val.map(v => [parseInt(v.GuildID), parseInt(v.UserID)]);
    global.snowflakeData = global.snowflakeData.concat(result);
});

// Collections creation
client.commands = new Discord.Collection();
client.slashcommands = new Discord.Collection();
client.contextCommands = new Discord.Collection();
client.consoleCommands = new Discord.Collection();
const TextCooldowns = new Map();
const SlashCooldowns = new Map();

// File finder/loader
function loadFiles(folder, callback) {
    const commandFiles = fs.readdirSync(folder);
    while (commandFiles.length > 0) {
        const file = commandFiles.shift();
        if (file.endsWith(".js")) {
            const loaded = require(`${folder}${file}`);
            loaded.filePath = folder + file;
            loaded.lastExecutionTime = 1000;
            callback(loaded, file);
        } else {
            if (!fs.lstatSync(folder + file).isDirectory()) continue;
            const newFiles = fs.readdirSync(folder + file);
            newFiles.forEach(f => commandFiles.push(file + "/" + f));
        }
    }
}

// Slash command handler
const discoveredCommands = [];
loadFiles("./Commands/slash/", (slashcommand, fileName) => {
    if ("name" in slashcommand && "execute" in slashcommand && "description" in slashcommand) {
        client.slashcommands.set(slashcommand.name, slashcommand);
        discoveredCommands.push(slashcommand);
    } else {
        global.logger.error(`[WARNING] The (/) command ${fileName} is missing a required "name", "execute", or "type" property.`);
    }
});

// Text command handler
loadFiles("./Commands/text/", function(command) {
    client.commands.set(command.name, command);

    if (command.aliases && Array.isArray(command.aliases)) {
        command.aliases.forEach(alias => {
            client.commands.set(alias, command);
        });
    }
});

// Context menu command handler
loadFiles("./Commands/context/", (contextcommand, fileName) => {
    if ("name" in contextcommand && "execute" in contextcommand && "type" in contextcommand) {
        client.contextCommands.set(contextcommand.name, contextcommand);
        discoveredCommands.push(contextcommand);
    } else {
        global.logger.error(`[WARNING] The (ctx) command ${fileName} is missing a required "name", "execute", or "type" property.`);
    }
});

// Event handler
loadFiles("./events/client/", function(event) {
    if (event.once) {
        client.once(event.name, (...args) => {
            if (event.log) global.logger.event(`Event: [${event.name}] fired.`);
            event.execute(client, global.logger, ...args);
        });
    } else {
        client.on(event.name, (...args) => {
            if (event.log) global.logger.event(`Event: [${event.name}] fired.`);
            event.execute(client, global.logger, ...args);
        });
    }
});

loadFiles("./events/process/", function(event) {
    process.on(event.name, (...args) => {
        event.execute(client, global.logger, ...args);
        if (event.log) global.logger.event(`Event: [${event.name}] fired.`);
    });
});

process.stdin.setEncoding("utf8");
loadFiles("./events/console/", function(event) {
    client.consoleCommands.set(event.name, event);
});

process.stdin.on("data", async (input) => {
    const args = input.split(/ +/);
    const commandName = args.shift().toLowerCase().trim();
    const command = client.consoleCommands.get(commandName);
    if (!command) return;

    process.stdout.write("\u001b[1A\u001b[2K");
    await console.logger(`
    Executing [${commandName}]
    by        [CONSOLE]
    ---------------------------`
        .replace(/^\s+/gm, ""));

    await command.execute(client, global.logger, ...args);
});


// Bot setup on startup
client.once(Events.ClientReady, async () => {
    console.log(global.player.scanDeps());

    const updateActivities = () => {
        const part3 = RandomMinMax(1, 255);
        const part4 = RandomMinMax(1, 255);
        let port = 0;
        if (Math.random() < 0.5)
            port = 25565;
        else 
            port = RandomMinMax(24500, 26000);
    
        // Combine the parts into a valid IPv4 address
        const ipAddress = `192.168.${part3}.${part4}:${port}`;
    
        for (let i = 0; i < activities.length; i++) {
            activities[i].name = activities[i].name.replace("Placeholder01", (100 / activities.length).toFixed(2));
            activities[i].name = activities[i].name.replace("Placeholder02", activities.length - 1);
            activities[i].name = activities[i].name.replace("Placeholder03", ipAddress);
            activities[i].name = activities[i].name.replace("Placeholder04", client.guilds.cache.size);
        
        // Set the activity with type and name
        }
        const randomActivity = activities[Math.floor(Math.random() * activities.length)];
        client.user.setActivity(randomActivity.name, { type: randomActivity.type });
    };
    
    
    if (process.env.SERVER != "dev") client.channels.cache.get(process.env.STATUS_CHANNEL_ID).send("Bot starting!");

    global.logger.info(`Bot starting on [${process.env.SERVER}]...`);

    console.log("Guild manager initiation...");
    const guilds = await client.guilds.fetch();
    await global.GuildManager.init(guilds);
    console.log("Guild manager initiation done.");

    console.log("Setting up commands...");
    await client.application.commands.set(discoveredCommands);
    console.log(`${client.slashcommands.size} (/) commands`);
    console.log(`${client.contextCommands.size} (ctx) commands`);
    console.log(`${client.commands.size} (text) commands (including aliases)`);
    console.log("commands setup done.");

    console.log(`Setting up activity status... (${activities.length} statuses)`);
    if (process.env.SERVER == "prod")
        updateActivities();
    else
        client.user.setActivity("Under maintenace...", { type: ActivityType.Custom });
    console.log("Activity status setup done.");

    console.log("Creating the cron jobs...");
    // - - - New Day - - -
    const scheduledMessage = new cron.CronJob("30 59 02 * * *", () => {
        // This runs every day at 02:59:30
        client.channels.cache.get("1069811223950016572").send("- - - - - New Day - - - - -");
    });

    const DailyActivity = new cron.CronJob("00 00 04 * * *", () => {
        updateActivities();
    });

    const RamLeakDetector = new cron.CronJob("0 * * * *", async () => {
        try {
            const memoryUsage = process.memoryUsage();
            HourlyRam.push((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100);
            HourlyRam.shift();
            if (HourlyRam[0] > 90 && HourlyRam[1] > 90 && HourlyRam [2] > 90) client.users.cache.get(process.env.OWNER_ID).send("Memory leak detected.");
        } catch (err) {
            global.logger.error("Couldn't get the RAM % for MemoryLeakDetector");
            global.logger.error(err);
        }
    });

    const SmartRestart = new cron.CronJob("* * * * *", async () => {
        if (client.voice.adapters.size == 0 && SmartRestartEnabled) {
            global.logger.severe("Restart requested from discord");
            client.channels.cache.get(process.env.STATUS_CHANNEL_ID).send("Restart requested from discord for reason : `Smart restart`");

            // After 3s, closes the database and then exits the process
            setTimeout(function() {
                /* ------------- */
                global.prisma.$disconnect();
                process.exit(1);
                /* ------------- */
            }, 1000 * 3);
        }
    });

    console.log("Starting the cron jobs...");
    // sarting the daily sending
    scheduledMessage.start();
    DailyActivity.start();
    RamLeakDetector.start();
    SmartRestart.start();
    console.log("Cron job setup done.");
    console.log("Discord.js version: " + require("discord.js").version);
    console.log(`There is ${client.options.shardCount} shard${client.options.shardCount > 1 ? "s" : ""} spawned`);
    whitelist.push(process.env.OWNER_ID);
    global.debug = DefaultDebugState;
    global.superuser = DefaultSuperuserState;
    if (process.env.SERVER == "dev") global.superuser = 1;
    console.log(`Debug is ${debug ? "en" : "dis"}abled\nSuperuser is ${superuser ? "en" : "dis"}abled`);

    console.log("Waiting for websocket to successfully connect.");
    console.logger(`
                                                                                  
                                 ██████████████                                 
                           ██████████████████████████                           
                       ██████████████████████████████████                       
                    ████████████████████████████████████████                    
                 ██████████████                  ██████████████                 
               ███████████                            ███████████               
             ██████████                                  ██████████             
           █████████                                        █████████           
          █████████             █               █             ████████          
         ████████              █                 █             █████████        
       ████████              ██                   ██             ████████       
      ████████               █                     █              ████████      
      ███████               ██                     ██              ████████     
     ███████                ██                     ██               ███████     
    ███████                 ██                    ███                ███████    
    ██████                  ███    ██████████     ███                 ███████   
   ███████                  █████████████████████████                 ███████   
   ██████                 ██████████         ██████████                ██████   
   ██████             ████████████████     ████████████████            ███████  
  ███████           ████      █████████████████████     █████          ███████  
  ███████          ██         ███  ███     ███  ███         ██         ███████  
  ███████         █           ███   █       █   ███          ██        ███████  
  ███████        █            ████   ███████   ████            █       ███████  
   ██████        █             ████   █████   ████             █       ███████  
   ██████                       █████ █████ █████                      ██████   
   ███████                        █████████████                       ███████   
    ██████                           ███████                          ███████   
    ███████                          ███████                         ███████    
    ████████                        █████████                       ███████     
      ███████        ██           ████     █████           ██      ████████     
      ████████         █████████████         ██████████████       ████████      
       ████████                                                  ████████       
         ████████                                               ████████        
          █████████                                           ████████          
           █████████                                        █████████           
             ██████████                                  ██████████             
               ███████████                            ███████████               
                 ██████████████                  ██████████████                 
                    ████████████████████████████████████████                    
                       ██████████████████████████████████                       
                           ██████████████████████████                           
                                 ██████████████                                 
        
    `);
    // start confirmation
    const interval = setInterval(() => {
        if (client.ws.ping !== -1) {
            if (process.env.SERVER != "dev") client.channels.cache.get(process.env.STATUS_CHANNEL_ID).send(`Bot Online!, **Ping**: \`${client.ws.ping}ms\``);
            global.logger.info("Bot started successfully.");
            clearInterval(interval);
        }
    }, 500);
});

// Debug event
client.on(Events.Debug, debug => {
    if (global.debug) console.log(debug);
});

// Slash command executing
client.on(Events.InteractionCreate, async interaction => {
    if (interaction.isChatInputCommand()) {

        const slash = interaction.client.slashcommands.get(interaction.commandName);

        if (!slash) return global.logger.error(`No command matching ${interaction.commandName} was found.`);

        // Check command cooldown
        if (SlashCooldowns.has(interaction.user.id)) {
            const cooldown = SlashCooldowns.get(interaction.user.id);
            const timeLeft = cooldown - Date.now();
            if (timeLeft > 0) {
                interaction.reply(`Please wait ${Math.ceil(timeLeft / 1000)} seconds before using that command again.`);
                return;
            }
        }

        // Set command cooldown
        const cooldownTime = slash.cooldown || 0;
        SlashCooldowns.set(interaction.user.id, Date.now() + cooldownTime);

        try {
        // execute the slash command
            await slash.execute(logger, interaction, client);

            // Logging the command
            global.logger.info(`Executing [/${interaction.commandName}]
            by    [${interaction.user.tag} (${interaction.user.id})]
            in    [${interaction.channel.name} (${interaction.channel.id})]
            from  [${interaction.guild.name} (${interaction.guild.id})]`
                .replace(/^\s+/gm, ""));

        } catch (error) {
            interaction.reply({
                embeds: [{
                    title: "An error occured while executing the command",
                    color: 0xff0000,
                    timestamp: new Date(),
                }],
                ephemeral: true,
            });

            global.logger.error(`Error executing slash command [${interaction.commandName}]`);
            global.logger.error(error.stack);
        }
    } else if (interaction.isContextMenuCommand()) {
        
        const context = client.contextCommands.get(interaction.commandName);

        if (!context) return console.error(`No command matching ${interaction.commandName} was found.`);

        try {
            await context.execute(logger, interaction, client);

            global.logger.info(`
            Executing [${interaction.commandName} (${context.type === 2 ? "User" : "Message"})]
            by   [${interaction.user.tag} (${interaction.user.id})]
            in   [${interaction.channel.name} (${interaction.channel.id})]
            from [${interaction.guild.name} (${interaction.guild.id})]`
                .replace(/^\s+/gm, ""));

        } catch (error) {
            interaction.reply({
                embeds: [{
                    title: "An error occured while executing the command",
                    color: 0xff0000,
                    timestamp: new Date(),
                }],
                ephemeral: true,
            });
            
            global.logger.error(`Error executing context menu command [${interaction.commandName}]`);
            global.logger.error(error);
        }
    }
});

// Text command executing
client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    if (superuser && !whitelist.includes(message.author.id)) return;
    if (!message.guild) return message.reply("Commands cannot be executed inside DMs.");
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
                // Timestamp: new Date(new Date(message.createdTimestamp).toLocaleString("en-US", {timeZone: "America/Toronto"})),
                Content: message.content,
            },
        });
    } catch (ex) {
        console.log(`[${getExactDate()} - SEVERE] Unable to write to database`);
        console.log(ex);
    }

    // Text command executing
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

        // Command auto-correction
        let command = client.commands.get(commandName);
        if (!command && AutoCommandMatch) {
            const commandSet = new Set(client.commands.filter(cmd => !cmd.private).map(cmd => cmd.name));
            const commandArray = Array.from(commandSet);
            const closeMatch = findClosestMatch(commandName, commandArray);
            if (closeMatch.distance <= 3) {
                // command = client.commands.get(closeMatch.closestMatch);
                await message.reply(`Did you mean ${prefix}${closeMatch.closestMatch}?`);
                const filter = (m) => m.author.id === message.author.id;
                await message.channel.awaitMessages({ filter, max: 1, time: 5000, errors: ["time"] })
                    .then((collected) => {
                        const responseMessage = collected.first();
                        if (responseMessage.content.toLowerCase().startsWith("yes")) command = client.commands.get(closeMatch.closestMatch);
                    }).catch(() => null);
            }
        }

        if (!command) return;
        // Admin commands checking
        if (command.admin && !message.member.permissions.has("Administrator") || !message.author.id == process.env.OWNER_ID) return SendErrorEmbed(message, "You are not administrator", "red");

        const userBlacklist = await GuildManager.GetBlacklist(message.guild.id);
        const blCategory = !userBlacklist.CheckPermission(message.author.id, command.category);
        const blCommand = !userBlacklist.CheckPermission(message.author.id, command.name);
        if (blCategory || blCommand) 
            return SendErrorEmbed(message, `You are blacklisted from executing ${!blCategory ? `commands in the **${command.category}** category` : `the **${command.name}** command`}.`, "red");
        

        // Check command cooldown
        if (TextCooldowns.has(message.author.id)) {
            const cooldown = TextCooldowns.get(message.author.id);
            const timeLeft = cooldown - Date.now();
            if (timeLeft > 0) {
                message.reply(`Please wait ${Math.ceil(timeLeft / 1000)} seconds before using that command again.`);
                return;
            }
        }

        // Set command cooldown
        const cooldownTime = command.cooldown || 0;
        TextCooldowns.set(message.author.id, Date.now() + cooldownTime);

        // Logging every executed commands
        global.logger.info(`
        Executing [${message.content}]
        by    [${message.member.user.tag} (${message.author.id})]
        in    [${message.channel.name} (${message.channel.id})]
        from  [${message.guild.name} (${message.guild.id})]`
            .replace(/^\s+/gm, ""));
        
        // Execute the command
        try {

            const startTime = Date.now();

            if (command.lastExecutionTime > 1000) await message.channel.sendTyping();

            // Check if the bot has the required permissions
            const botPermissions = message.guild.members.cache.get(client.user.id)?.permissions?.bitfield;
            const requiredPermissions = command.permission || [];
            requiredPermissions.push(PermissionFlagsBits.SendMessages);

            if (requiredPermissions.length > 0) {
                const missingPermissions = requiredPermissions.filter(permission => !(botPermissions & BigInt(permission)));
                if (missingPermissions.length > 0) return SendErrorEmbed(message, `The bot is missing the following permissions: ${missingPermissions.join(", ")}`, "red");
            }

            await command.execute(global.logger, client, message, args);
            command.lastExecutionTime = parseInt(Date.now() - startTime);

        } catch (error) {
            global.logger.error(error.stack);
            return SendErrorEmbed(message, "An error occured while executing the command", "red");
        }
    }
});
// Logins with the token
client.login(process.env.TOKEN);