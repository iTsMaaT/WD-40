require("dotenv").config();

const { ShardingManager } = require("discord.js");

const manager = new ShardingManager("./bot.js", { 
    token: process.env.SERVER === "dev" && process.env.DEV_TOKEN ? process.env.DEV_TOKEN : process.env.TOKEN,
    execArgv: process.execArgv,
    // totalShards: 2,
});

manager.on("shardCreate", shard => console.debug(`[ShardingManager - Shard ${shard.id}] Launched`));

manager.spawn();