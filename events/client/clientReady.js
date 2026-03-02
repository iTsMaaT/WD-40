const { Events, ActivityType } = require("discord.js");
const config = require("@utils/config/configUtils");
const GuildManager = require("@guildManager");
const randomMinMax = require("@root/utils/functions/randomMinMax");
const { initConfFile } = require("@root/utils/reddit/fetchRedditToken.js");
const { useMainPlayer } = require("discord-player");
const { activateRotator } = require("@utils/helpers/activityStatusRotator");
const player = useMainPlayer();
const { toEngineerNotation } = require("@utils/functions/formattingFunctions");
const { updateCommands } = require("@utils/helpers/deployCommands");
const LiveUpdatingBotStats = require("@utils/helpers/liveUpdatingBotStats");

module.exports = {
    name: Events.ClientReady,
    once: false,
    log: true,
    async execute(client, logger) {
        console.log(player.scanDeps());
        console.log("Extractors ordered by priority:");

        // Sort extractors by priority in descending order
        const sortedExtractors = [...player.extractors.store.values()].sort((a, b) => b.priority - a.priority);

        // Calculate lengths for alignment
        const maxNameLength = Math.max(...sortedExtractors.map(e => e.constructor.name.replace(/^_/, "").length));
        const maxPriorityLength = Math.max(...sortedExtractors.map(e => e.priority.toString().length));

        // Log the extractors with aligned formatting
        for (const extractor of sortedExtractors) {
            const name = extractor.constructor.name.replace(/^_/, ""); // Remove leading underscore

            console.logger(`- ${name.padEnd(maxNameLength)} (${extractor.priority.toString().padStart(maxPriorityLength)})`);
        }

        if (process.env.SERVER != "dev" && process.env.STATUS_CHANNEL_ID) client.channels.cache.get(process.env.STATUS_CHANNEL_ID).send("Bot starting!");

        logger.info(`Bot starting on [${process.env.SERVER}]...`);
        
        console.log("Activating activity status rotator...");
        activateRotator(client, process.env.SERVER);
        console.log("Activity status rotator activated.");

        console.log("Initializing Reddit conf file...");
        await initConfFile();
        console.log("Reddit config file initialized.");

        console.log("Guild manager initiation...");
        const guilds = client.guilds.cache;
        console.log(`Found ${guilds.size} guilds.`);
        await GuildManager.init(guilds, client);
        console.log("Guild manager initiation done.");

        console.log("Setting up commands...");
        await updateCommands(client, logger);
        client.discoveredCommands = undefined;
        console.log(`${client.slashcommands.size} (/) commands`);
        console.log(`${client.contextcommands.size} (ctx) commands`);
        console.log(`${client.commands.size} (text) commands (including aliases)`);
        console.log("commands setup done.");

        console.log("Discord.js version: " + require("discord.js").version);
        console.log(`There is ${client.options.shardCount} shard${client.options.shardCount > 1 ? "s" : ""} spawned`);
        config.set("SUPERUSER_WHITELIST", [...config.get("SUPERUSER_WHITELIST"), process.env.OWNER_ID]);
        console.log(`Whitelisted users: ${config.get("SUPERUSER_WHITELIST").join(", ")}`);
        if (process.env.SERVER == "dev") config.set("defaultSuperuserState", true);
        console.log(`Debug is ${config.get("defaultDebugState") ? "en" : "dis"}abled`);
        console.log(`Superuser is ${config.get("defaultSuperuserState") ? "en" : "dis"}abled`);

        if (config.get("LIVE_UPDATE_CHANNEL_ID")) {
            console.log("Starting LiveUpdatingBotStats...");
            const liveUpdatingBotStats = new LiveUpdatingBotStats(client, client.channels.cache.get(config.get("LIVE_UPDATE_CHANNEL_ID")));
            liveUpdatingBotStats.start();
            console.log("LiveUpdatingBotStats started.");
        }

        console.log("Waiting for websocket to report sensical ping (> -1ms)");
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
        client.clientInitialized = true;
        // console.warn = console.warning;
        // start confirmation
        const interval = setInterval(() => {
            if (client.ws.ping !== -1) {
                if (process.env.SERVER != "dev" && config.get("STATUS_CHANNEL_ID")) client.channels.cache.get(config.get("STATUS_CHANNEL_ID")).send(`Bot Online!, **Ping**: \`${client.ws.ping}ms\``);
                logger.info(`Bot started successfully with a websocket ping of ${client.ws.ping}ms`);
                clearInterval(interval);
            }
        }, 500);
    },
};