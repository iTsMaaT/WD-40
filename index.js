(async () => {
    const Discord = require("discord.js");
    const dotenv = require("dotenv");
    dotenv.config();
    require("module-alias/register");
    const cron = require("cron");

    const Sentry = require("@sentry/node");

    if (process.env.SERVER == "prod" && process.env.SENTRY_DSN) {
        const { version } = require("@root/package.json");
        const packageJSONVersion = version.split(".");
        Sentry.init({
            dsn: process.env.SENTRY_DSN,
            release: packageJSONVersion,
        });
    }

    const logger = require("@utils/log");
    console.warner = console.warn;
    console.logger = console.log;
    // console.warn = (log, args) => logger.warning(log + " " + util.format(args));
    console.log = (message, ...args) => logger.console(message, ...args);
    console.warn = (message, ...args) => logger.warning(message, ...args);
    console.error = (message, ...args) => logger.error(message, ...args);
    console.info = (message, ...args) => logger.info(message, ...args);
    console.debug = (message, ...args) => logger.debug(message, ...args);
    console.log("Logger instanciated");

    const { Client, GatewayIntentBits, Partials } = require("discord.js");
    const { getPermissionArrayNames } = require("@functions/discordFunctions");
    const config = require("@utils/config/configUtils");

    const fs = require("fs").promises;
    const path = require("path");

    const neededIntents = {
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMembers,
            GatewayIntentBits.GuildModeration,
            GatewayIntentBits.GuildExpressions,
            GatewayIntentBits.GuildIntegrations,
            GatewayIntentBits.GuildWebhooks,
            GatewayIntentBits.GuildInvites,
            GatewayIntentBits.GuildVoiceStates,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.GuildMessageReactions,
            GatewayIntentBits.MessageContent,
        ],
        partials: [
            Partials.Message,
            Partials.Channel,
            Partials.Reaction,
        ],
    };

    const client = new Client({
        ...neededIntents,
        shards: "auto",
        allowedMentions: { repliedUser: false },
    });

    const { registerExtractors, initPlayer } = require("@utils/helpers/registerExtractors");
    const player = await initPlayer(client);
    await registerExtractors(player);

    console.log(`Daily reregistering ${config.get("discordPlayer")?.dailyReregister ? "enabled" : "disabled"}`);
    new cron.CronJob(config.get("cronJobs").dailyReregister, async () => {
        if (config.get("discordPlayer")?.dailyReregister) await registerExtractors(player);
    }, null, true, config.get("timeZone"));

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

    console.log("Variables loaded");

    module.exports = { client };

    const EmbedGenerator = require("@utils/helpers/embedGenerator");

    // Collections creation
    client.commands = new Discord.Collection();
    client.slashcommands = new Discord.Collection();
    client.contextcommands = new Discord.Collection();
    client.consoleCommands = new Discord.Collection();
    client.TextCooldowns = new Map();
    client.SlashCooldowns = new Map();
    const permissionBitFields = [];

    /**
     * Asynchronously load JavaScript files from a folder (recursive)
     * 
     * @param {string} folder The folder to load files from
     * @param {Function} callback The callback function (can be async)
     * 
     * @returns {Promise<void>}
     */
    async function loadFiles(folder, callback) {
        const commandFiles = await fs.readdir(folder);

        while (commandFiles.length > 0) {
            const file = commandFiles.shift();
            const fullPath = path.join(folder, file);
            const absolutePath = path.resolve(fullPath);

            const stat = await fs.lstat(absolutePath);
            if (stat.isDirectory()) {
                const newFiles = await fs.readdir(absolutePath);
                newFiles.forEach(f => commandFiles.push(path.join(file, f)));
            } else if (file.endsWith(".js")) {
                try {
                    const loaded = require(absolutePath); // Use absolute path for require
                    loaded.filePath = absolutePath; // Store absolute path for reference

                    if (loaded.loadFileIgnore) continue;
                    await callback(loaded, file);
                } catch (err) {
                    console.error(`Failed to load ${absolutePath}:`, err);
                }
            }
        }
    }

    await loadFiles("./utils/validators/", async (validator) => {
        if (!validator.execute) {
            logger.severe(`Validator [${validator.filePath}] is missing an execute function`);
            process.exit(0);
        }

        try {
            await validator.execute();
        } catch (error) {
            logger.severe(`Validator [${validator.filePath}] failed to execute`);
            logger.error(error);
            process.exit(0);
        }
    });

    // Slash command handler
    client.discoveredCommands = [];
    await loadFiles("./commands/slash/", (slashcommand, fileName) => {
        if ("name" in slashcommand && "execute" in slashcommand && "description" in slashcommand) {
            if (client.slashcommands.get(slashcommand.name)) throw new Error(`Slash command or alias [${slashcommand.name}] already exists`);
            client.slashcommands.set(slashcommand.name, slashcommand);
            client.discoveredCommands.push(slashcommand);
        } else {
            logger.error(`[WARNING] The (/) command ${fileName} is missing a required "name", "execute", or "type" property.`);
        }
    });

    // Text command handler
    await loadFiles("./commands/text/", (command) => {
        try {
            if (command.description.length > 100) throw new Error(`Text command [${command.name}] description is too long (${command.description.length} characters, max 100)\n${command.filePath}`); 
            command.isAlias = false;
            command.lastExecutionTime = 1000;
            if (client.commands.get(command.name)) throw new Error(`Text command [${command.name}] already exists\n${command.filePath}`);
            client.commands.set(command.name, command);
            if (!command.cooldown) command.cooldown = config.get("baseCommandCooldown") || 3000;

            if (command.aliases && Array.isArray(command.aliases)) {
                command.isAlias = true;
                command.aliases.forEach(alias => {
                    if (client.commands.get(alias)) throw new Error(`Text command alias [${alias}] already exists\n${command.filePath}`);
                    client.commands.set(alias, command);
                });
            }
        } catch (error) {
            logger.error(`Failed to load text command [${command.name}]: ${error.message}`);
            process.exit(0);
        }

        if (command.permissions) permissionBitFields.push(...command.permissions);
    });

    console.logger([
        "--------------------------------------------------",
        "Required permissions:",
        "--------------------------------------------------",
        `${getPermissionArrayNames(permissionBitFields).join("\n")}`,
        "--------------------------------------------------",
    ].join("\n"));

    // Context menu command handler
    await loadFiles("./commands/context/", (contextcommand, fileName) => {
        if ("name" in contextcommand && "execute" in contextcommand && "type" in contextcommand) {
            if (client.contextcommands.get(contextcommand.name)) throw new Error(`Context command or alias [${contextcommand.name}] already exists`);
            client.contextcommands.set(contextcommand.name, contextcommand);
            client.discoveredCommands.push(contextcommand);
        } else {
            logger.error(`[WARNING] The (ctx) command ${fileName} is missing a required "name", "execute", or "type" property.`);
        }
    });

    // Event handler
    await loadFiles("./events/client/", (event) => {
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

    await loadFiles("./events/process/", (event) => {
        process.on(event.name, async (...args) => {
            if (event.log) logger.event(`Event: [${event.name}] fired.`);
            await event.execute(client, logger, ...args);
        });
    });

    await loadFiles("./events/rest/", (event) => {
        client.rest.on(event.name, async (...args) => {
            if (event.log) logger.event(`Event: [${event.name}] fired.`);
            await event.execute(client, logger, ...args);
        });
    });

    await loadFiles("./events/player/", (event) => {
        player.on(event.name, async (...args) => {
            if (event.log) logger.event(`Event: [${event.name}] fired.`);
            await event.execute(client, logger, ...args);
        });
    });

    await loadFiles("./events/playerEvents/", (event) => {
        player.events.on(event.name, async (...args) => {
            if (event.log) logger.event(`Event: [${event.name}] fired.`);
            await event.execute(client, logger, ...args);
        });
    });

    process.stdin.setEncoding("utf8");
    await loadFiles("./events/console/", (event) => {
        if (client.consoleCommands.get(event.name)) throw new Error(`Command or alias [${event.name}] already exists`);
        client.consoleCommands.set(event.name, event);
    });

    process.stdin.on("data", async (input) => {
        const trimmedInput = input.trim();
        process.stdout.write(trimmedInput + "\n");
        const args = trimmedInput.split(/ +/);
        const commandName = args.shift().toLowerCase();
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
    client.login(process.env.SERVER === "dev" && process.env.DEV_TOKEN ? process.env.DEV_TOKEN : process.env.TOKEN);
})();