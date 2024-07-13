const { Events, ActivityType } = require("discord.js");
const { activities, blacklist, whitelist, DefaultSuperuserState, DefaultDebugState, AutoCommandMatch } = require("@utils/config.json");
const GuildManager = require("@root/utils/GuildManager");
const RandomMinMax = require("@utils/functions/RandomMinMax");
const { initConfFile } = require("@root/utils/reddit/fetchRedditToken.js");
const { useMainPlayer } = require("discord-player");
const player = useMainPlayer();

module.exports = {
    name: Events.ClientReady,
    once: false,
    log: true,
    async execute(client, logger) {
        console.log(player.scanDeps());

        const updateActivities = () => {
            const part1 = RandomMinMax(1, 255);
            const part2 = RandomMinMax(1, 255);
            const part3 = RandomMinMax(1, 255);
            const part4 = RandomMinMax(1, 255);
            let port = 0;
            if (Math.random() < 0.5)
                port = 25565;
            else 
                port = RandomMinMax(24500, 26000);
    
            // Combine the parts into a valid IPv4 address
            const ipAddress = `${part1}.${part2}.${part3}.${part4}`;
    
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

        logger.info(`Bot starting on [${process.env.SERVER}]...`);

        console.log("Initializing Reddit conf file...");
        await initConfFile();
        console.log("Reddit conf file initialized.");

        console.log("Guild manager initiation...");
        const guilds = await client.guilds.fetch();
        await GuildManager.init(guilds);
        console.log("Guild manager initiation done.");

        console.log("Setting up commands...");
        await client.application.commands.set(client.discoveredCommands);
        client.discoveredCommands = undefined;
        console.log(`${client.slashcommands.size} (/) commands`);
        console.log(`${client.contextCommands.size} (ctx) commands`);
        console.log(`${client.commands.size} (text) commands (including aliases)`);
        console.log("commands setup done.");

        console.log(`Setting up activity status... (${activities.length} statuses)`);
        if (process.env.SERVER == "prod")
            updateActivities();
        else
            client.user.setActivity("Under maintenance...", { type: ActivityType.Custom });
        console.log("Activity status setup done.");

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
                logger.info("Bot started successfully.");
                clearInterval(interval);
            }
        }, 500);
    },
};