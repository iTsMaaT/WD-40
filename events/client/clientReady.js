const { Events, ActivityType } = require("discord.js");
const config = require("@utils/config/configUtils");
const GuildManager = require("@root/utils/GuildManager");
const RandomMinMax = require("@root/utils/functions/randomMinMax");
const { initConfFile } = require("@root/utils/reddit/fetchRedditToken.js");
const { useMainPlayer } = require("discord-player");
const { activateRotator } = require("@utils/helpers/activityStatusRotator");
const player = useMainPlayer();

module.exports = {
    name: Events.ClientReady,
    once: false,
    log: true,
    async execute(client, logger) {
        console.log(player.scanDeps());
       
        if (process.env.SERVER != "dev") client.channels.cache.get(process.env.STATUS_CHANNEL_ID).send("Bot starting!");

        logger.info(`Bot starting on [${process.env.SERVER}]...`);
        
        console.log("Activating activity status rotator...");
        activateRotator(client, process.env.SERVER);
        console.log("Activity status rotator activated.");

        console.log("Initializing Reddit conf file...");
        await initConfFile();
        console.log("Reddit conf file initialized.");

        console.log("Guild manager initiation...");
        const guilds = await client.guilds.fetch();
        await GuildManager.init(guilds, client);
        console.log("Guild manager initiation done.");

        console.log("Setting up commands...");
        await client.application.commands.set(client.discoveredCommands);
        client.discoveredCommands = undefined;
        console.log(`${client.slashcommands.size} (/) commands`);
        console.log(`${client.contextCommands.size} (ctx) commands`);
        console.log(`${client.commands.size} (text) commands (including aliases)`);
        console.log("commands setup done.");

        console.log("Discord.js version: " + require("discord.js").version);
        console.log(`There is ${client.options.shardCount} shard${client.options.shardCount > 1 ? "s" : ""} spawned`);
        config.set("whitelist", [...config.get("whitelist"), process.env.OWNER_ID]);
        if (process.env.SERVER == "dev") config.set("defaultSuperuserState", true);
        console.log(`Debug is ${config.get("DefaultDebugState") ? "en" : "dis"}abled`);
        console.log(`Superuser is ${config.get("DefaultSuperuserState") ? "en" : "dis"}abled`);

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
        // console.warn = console.warning;
        // start confirmation
        const interval = setInterval(() => {
            if (client.ws.ping !== -1) {
                if (process.env.SERVER != "dev") client.channels.cache.get(process.env.STATUS_CHANNEL_ID).send(`Bot Online!, **Ping**: \`${client.ws.ping}ms\``);
                logger.info(`Bot started successfully with a websocket ping of ${client.ws.ping}ms`);
                clearInterval(interval);
            }
        }, 500);
    },
};