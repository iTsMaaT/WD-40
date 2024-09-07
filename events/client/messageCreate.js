const { Events, PermissionsBitField } = require("discord.js");
const GuildManager = require("@root/utils/GuildManager");
const { repositories } = require("@utils/db/tableManager.js");
const getExactDate = require("@functions/getExactDate");
const embedGenerator = require("@utils/helpers/embedGenerator");
const RandomMinMax = require("@root/utils/functions/randomMinMax");
const { findBestMatch, algorithms } = require("@utils/algorithms/findBestMatch");
const { initConfFile } = require("@utils/reddit/fetchRedditToken.js");
const countCommonChars = require("@utils/functions/countCommonChars.js");
const config = require("@utils/config/configUtils");

module.exports = {
    name: Events.MessageCreate,
    once: false,
    log: false,
    async execute(client, logger, msg) {
        const TextCooldowns = client.TextCooldowns;
        handleCommand(msg);
        handleAutoResponses(msg);

        async function handleAutoResponses(message) {
            if (message.author.bot) return;
            if (!message.guild) return;
            const prefix = GuildManager.GetPrefix(message.guild);

            if (message.content.trim() == `<@${client.user.id}>`) {
                const embed = {
                    color: 0xffffff,
                    description: `**Prefix** : ${prefix}\n**Help command** : ${prefix}help`,
                    timestamp: new Date(),
                };
                message.reply({ embeds: [embed] });
            }

            if (config.get("defaultSuperuserState") && (message.author.id != process.env.OWNER_ID && config.get("whitelist").includes(message.author.id))) return;
            if (config.get("blacklist").includes(message.author.id)) return;

            const autoreactions = await GuildManager.getAutoReactions(message.guild.id);
            const reactions = await autoreactions.matchReactions(message.channel.name, message.content, message.attachments.size > 0);
            if (reactions) {
                reactions.forEach(async (reaction) => {
                    await message.react(reaction).catch(() => null);
                });
            }

            const autoresponses = await GuildManager.getAutoResponses(message.guild.id);
            const responses = await autoresponses.matchResponses(message.channel.name, message.content, message.attachments.size > 0);
            if (responses) {
                responses.forEach(async (res) => {
                    await message.reply(res).catch(() => null);
                });
            }

            // Auto-responses
            if (GuildManager.GetResponses(message.guild)) {

                if (/((?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([^/?#&]+)).*/g.test(message.content)) {
                    message.reply(`
**How to download a Instagram media.**
Step 1 - Copy the post's link
Step 2 - Go to this URL (https://snapinsta.app/)     
Step 3 - Paste the link in the "Paste URL Instagram" box
Step 4 - Click download
Step 5 - Send the downloaded media to your favorite social media!
    `);}

                // skull reaction to skull emoji
                if (message.content.toLowerCase() == "💀") 
                    message.react("💀");
            

                // Ping fail if doesnt have @everyone perm
                if (message.member && !message.member.permissions.has("MentionEveryone") && (message.content.includes("@everyone") || message.content.includes("@here"))) 
                    message.reply("Ping fail L");
            }
        }

        async function handleCommand(message) {
            if (message.author.bot) return;
            if (config.get("defaultSuperuserState") && !config.get("whitelist").includes(message.author.id)) return;
            if (!message.guild) return message.reply("Commands cannot be executed inside DMs.");
            if (config.get("blacklist").includes(message.author.id)) return;

            // Text command executing
            const prefix = GuildManager.GetPrefix(message.guild);
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
                if (!command && config.get("autoCommandMatch")) {
                    const commandSet = new Set(client.commands.filter(cmd => !cmd.private).map(cmd => cmd.name));
                    const commandArray = Array.from(commandSet);
                    const closeMatch = findBestMatch(algorithms.FUZZY_MATCH, commandName, commandArray).match;
                    if (closeMatch.distance <= 2 && countCommonChars(commandName, closeMatch.closestMatch) != 0) {
                        // command = client.commands.get(closeMatch.closestMatch);
                        await message.reply(`Did you mean \`${prefix}${closeMatch.closestMatch}\`?`);
                        const filter = (m) => m.author.id === message.author.id;
                        await message.channel.awaitMessages({ filter, max: 1, time: 5000, errors: ["time"] })
                            .then((collected) => {
                                const responseMessage = collected.first();
                                if (responseMessage.content.toLowerCase().startsWith("yes")) command = client.commands.get(closeMatch.closestMatch);
                            }).catch(() => null);
                    }
                }

                if (!command) return;
                if (command.private && message.author.id !== process.env.OWNER_ID) return;
                // Admin commands checking
                if (command.admin && !message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return await message.reply({ embeds: [embedGenerator.error("You are not administrator")] });
                if (command.inVoiceChannel && !message.member.voice.channel) return await message.reply({ embeds: [embedGenerator.error("You must be in a voice channel.")] });

                const userBlacklist = await GuildManager.GetBlacklist(message.guild.id);
                const blCategory = !userBlacklist.CheckPermission(message.author.id, command.category);
                const blCommand = !userBlacklist.CheckPermission(message.author.id, command.name);
                if (blCategory || blCommand) 
                    return await message.reply({ embeds: [embedGenerator.error(`You are blacklisted from executing ${blCategory ? `commands in the **${command.category}** category` : `the **${command.name}** command`}.`)] });
    

                // Check command cooldown
                if (TextCooldowns.has(message.author.id)) {
                    const cooldown = TextCooldowns.get(message.author.id);
                    let timeLeft = cooldown - Date.now();
                    if (config.get("defaultSuperuserState") && config.get("whitelist").includes(message.author.id)) timeLeft = 0;
                    if (timeLeft > 0) {
                        message.reply({ embeds: [embedGenerator.warning(`Please wait ${Math.ceil(timeLeft / 1000)} seconds before using that command again.`)] });
                        return;
                    }
                }

                // Set command cooldown
                const cooldownTime = command.cooldown || 0;
                TextCooldowns.set(message.author.id, Date.now() + cooldownTime);

                // Logging every executed commands
                logger.info(`
    Executing [${message.content}]
    by    [${message.member.user.tag} (${message.author.id})]
    in    [${message.channel.name} (${message.channel.id})]
    from  [${message.guild.name} (${message.guild.id})]`
                    .replace(/^\s+/gm, ""));
    
                // Execute the command
                try {

                    const startTime = Date.now();

                    // Check if the bot has the required permissions
                    const botMember = message.guild.members.me;
                    if (!botMember) return;
                    
                    const botPermissions = botMember.permissions;
                    
                    if (!botPermissions.has(PermissionsBitField.Flags.SendMessages)) return;
                    if (command.lastExecutionTime >= 1000) await message.channel.sendTyping();

                    const requiredPermissions = command.permissions || [];

                    if (requiredPermissions.length > 0 && !botPermissions.has(PermissionsBitField.Flags.Administrator)) {
                        const missingPermissions = requiredPermissions.filter(permission => !botPermissions.has(permission));
                        if (missingPermissions.length > 0) 
                            return await message.reply({ embeds: [embedGenerator.error(`The bot is missing the following permissions: ${missingPermissions.join(", ")}`)] });
                    }


                    const optionalArgs = {};
                    if (typeof command.usage === "object") {
                        const usage = command.usage;
                        const optionalKeys = Object.keys(usage.optional ?? {});

                        for (let part = args.length - 1; part >= 0; part--) {
                            for (const k of optionalKeys) {
                                if (k.toLowerCase().split("|").map(s => "-" + s).includes(args[part]?.toLowerCase())) {
                                    if (usage.optional[k].hasValue) {
                                        optionalArgs[k] = args[parseInt(part) + 1];
                                        args.splice(part, 2);
                                    } else {
                                        optionalArgs[k] = true;
                                        args.splice(part, 1);
                                    }
                                }
                            }
                        }
                    }

                    await command.execute(logger, client, message, args, optionalArgs);
                    command.lastExecutionTime = parseInt(Date.now() - startTime);

                } catch (error) {
                    logger.error(error.stack);
                    return await message.reply({ embeds: [embedGenerator.error("An error occured while executing the command")] });
                }
            }
        }
    },
};