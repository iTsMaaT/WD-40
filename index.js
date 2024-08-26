const Discord = require("discord.js");
const dotenv = require("dotenv");
dotenv.config();
require("module-alias/register");
const util = require("util");

const logger = require("@utils/log");
console.warner = console.warn;
console.logger = console.log;
// console.warn = (log, args) => logger.warning(log + " " + util.format(args));
console.log = (log) => logger.console(log);
console.log("Logger instanciated");

const { Client, GatewayIntentBits, Partials } = require("discord.js");
const { getPermissionArrayNames } = require("@functions/discordFunctions");
const config = require("@utils/config/configUtils");

const fs = require("fs");

const client = new Client({
    intents: Object.keys(GatewayIntentBits),
    partials: Object.keys(Partials),
    shards: "auto",
    allowedMentions: { repliedUser: false },
});

global.wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Add array.equals()
Array.prototype.equals = function(otherArray) {
    return this.length === otherArray.length && this.every((value, index) => value === otherArray[index]);
};

// Add array.shuffle()
Array.prototype.shuffle = function() {
    for (let i = this.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this[i], this[j]] = [this[j], this[i]];
    }
    return this;
};
// music
const { Player } = require("discord-player");
const { YouTubeExtractor, BridgeProvider, BridgeSource, SpotifyExtractor } = require("@discord-player/extractor");
// const { default: DeezerExtractor } = require("discord-player-deezer");
// const { default: TidalExtractor } = require("discord-player-tidal");
const { YoutubeiExtractor, createYoutubeiStream } = require("discord-player-youtubei");
const player = new Player(client, {
    // bridgeProvider: discordPlayer.removeYoutube ? new BridgeProvider(BridgeSource.SoundCloud) : new BridgeProvider(BridgeSource.Auto),
    ytdlOptions: {
        requestOptions: {
            headers: {
                cookie: undefined,
            },
        },
    },
    skipFFmpeg: false,
});
(async () => {
    if (!config.get("discordPlayerConf")?.removeYoutube) {
        await player.extractors.register(YoutubeiExtractor, {
            authentication: process.env.YOUTUBE_ACCESS_STRING || "",
            streamOptions: {
                useClient: undefined,
                highWaterMark: 2 * 1024 * 1024,
            }, 
        });
    }
    // await player.extractors.loadDefault();
    await player.extractors.loadDefault((ext) => !["YouTubeExtractor"].includes(ext));
    // await player.extractors.register(DeezerExtractor);
    // await player.extractors.register(TidalExtractor);
})();

console.log("Variables loaded");

module.exports = { client };

const EmbedGenerator = require("@utils/helpers/embedGenerator");

// Collections creation
client.commands = new Discord.Collection();
client.slashcommands = new Discord.Collection();
client.contextCommands = new Discord.Collection();
client.consoleCommands = new Discord.Collection();
client.TextCooldowns = new Map();
client.SlashCooldowns = new Map();
const permissionBitFields = [];

// File finder/loader
function loadFiles(folder, callback) {
    const commandFiles = fs.readdirSync(folder);
    while (commandFiles.length > 0) {
        const file = commandFiles.shift();
        if (file.endsWith(".js")) {
            const loaded = require(`${folder}${file}`);
            loaded.filePath = (folder + file).replace("./", process.cwd() + "/");
            callback(loaded, file);
        } else {
            if (!fs.lstatSync(folder + file).isDirectory()) continue;
            const newFiles = fs.readdirSync(folder + file);
            newFiles.forEach(f => commandFiles.push(file + "/" + f));
        }
    }
}

loadFiles("./utils/validators/", async (validator) => {
    if (!validator.execute) {
        logger.severe(`Validator [${validator.filePath}] is missing an execute function`);
        process.exit(0);
    }
    await validator.execute();
});

// Slash command handler
client.discoveredCommands = [];
loadFiles("./commands/slash/", (slashcommand, fileName) => {
    if ("name" in slashcommand && "execute" in slashcommand && "description" in slashcommand) {
        if (client.slashcommands.get(slashcommand.name)) throw new Error(`Slash command or alias [${slashcommand.name}] already exists`);
        client.slashcommands.set(slashcommand.name, slashcommand);
        client.discoveredCommands.push(slashcommand);
    } else {
        logger.error(`[WARNING] The (/) command ${fileName} is missing a required "name", "execute", or "type" property.`);
    }
});

// Text command handler
loadFiles("./commands/text/", (command) => {
    command.isAlias = false;
    command.lastExecutionTime = 1000;
    if (client.commands.get(command.name)) throw new Error(`Text command [${command.name}] already exists\n${command.filePath}`);
    client.commands.set(command.name, command);
    if (!command.cooldown) command.cooldown = 3000;

    if (command.aliases && Array.isArray(command.aliases)) {
        command.isAlias = true;
        command.aliases.forEach(alias => {
            if (client.commands.get(alias)) throw new Error(`Text command alias [${alias}] already exists\n${command.filePath}`);
            client.commands.set(alias, command);
        });
    }

    if (command.permissions) permissionBitFields.push(...command.permissions);
});

console.log(`
--------------------------------------------------
Required permissions:
--------------------------------------------------
${getPermissionArrayNames(permissionBitFields).join("\n")}
--------------------------------------------------
`);

// Context menu command handler
loadFiles("./commands/context/", (contextcommand, fileName) => {
    if ("name" in contextcommand && "execute" in contextcommand && "type" in contextcommand) {
        if (client.contextCommands.get(contextcommand.name)) throw new Error(`Context command or alias [${contextcommand.name}] already exists`);
        client.contextCommands.set(contextcommand.name, contextcommand);
        client.discoveredCommands.push(contextcommand);
    } else {
        logger.error(`[WARNING] The (ctx) command ${fileName} is missing a required "name", "execute", or "type" property.`);
    }
});

// Event handler
loadFiles("./events/client/", (event) => {
    if (event.once) {
        client.once(event.name, async (...args) => {
            if (event.log) logger.event(`Event: [${event.name}] fired.`);
            await event.execute(client, logger, ...args);
        });
    } else {
        client.on(event.name, async (...args) => {
            if (event.log) logger.event(`Event: [${event.name}] fired.`);
            await event.execute(client, logger, ...args);
        });
    }
});

loadFiles("./events/process/", (event) => {
    process.on(event.name, async (...args) => {
        if (event.log) logger.event(`Event: [${event.name}] fired.`);
        await event.execute(client, logger, ...args);
    });
});

loadFiles("./events/player/", (event) => {
    player.events.on(event.name, async (...args) => {
        if (event.log) logger.event(`Event: [${event.name}] fired.`);
        await event.execute(client, logger, ...args);
    });

    player.on(event.name, async (...args) => {
        if (event.log) logger.event(`Event: [${event.name}] fired.`);
        await event.execute(client, logger, ...args);
    });
});

process.stdin.setEncoding("utf8");
loadFiles("./events/console/", (event) => {
    if (client.consoleCommands.get(event.name)) throw new Error(`Command or alias [${event.name}] already exists`);
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

    await command.execute(client, logger, args);
});

// Logins with the token
client.login(process.env.SERVER === "dev" ? process.env.DEV_TOKEN : process.env.TOKEN);