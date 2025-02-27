const { Events, PermissionsBitField } = require("discord.js");
const { useMainPlayer } = require("discord-player");
const GuildManager = require("@guildManager");
const { repositories } = require("@utils/db/tableManager.js");
const getExactDate = require("@functions/getExactDate");
const embedGenerator = require("@utils/helpers/embedGenerator");
const randomMinMax = require("@root/utils/functions/randomMinMax");
const { findBestMatch, algorithms } = require("@utils/algorithms/findBestMatch");
const { initConfFile } = require("@utils/reddit/fetchRedditToken.js");
const countCommonChars = require("@utils/functions/countCommonChars.js");
const config = require("@utils/config/configUtils");
const dbManager = require("@root/utils/db/databaseManager");
const { getPermissionArrayNames } = require("@functions/discordFunctions");

module.exports = {
    name: Events.MessageCreate,
    once: false,
    log: false,
    async execute(client, logger, msg) {
        const TextCooldowns = client.TextCooldowns;
        const autoCorrectCooldowns = new Map();
        await handleCommand(msg);
        try {
            await handleAutoResponses(msg);
        } catch (error) {
            logger.error(error);
        }

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

            if (config.get("defaultSuperuserState") && (message.author.id != process.env.OWNER_ID && config.get("SUPERUSER_WHITELIST").includes(message.author.id))) return;
            if (config.get("GLOBAL_BLACKLIST").includes(message.author.id)) return;

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
    `);
                }

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
            if (config.get("defaultSuperuserState") && !config.get("SUPERUSER_WHITELIST").includes(message.author.id)) return;
            if (!message.guild) return;
            if (config.get("GLOBAL_BLACKLIST").includes(message.author.id)) return;

            const prefix = GuildManager.GetPrefix(message.guild);
            if (!message.content.startsWith(prefix) && !message.content.startsWith(`<@${client.user.id}>`)) return;

            let args, commandName;
            if (!message.content.startsWith(`<@${client.user.id}> `)) {
                args = message.content.slice(prefix.length).trim().split(/ +/);
                commandName = args.shift()?.toLowerCase();
            } else {
                args = message.content.split(/ +/).slice(1);
                commandName = args.shift()?.toLowerCase();
            }

            let command = client.commands.get(commandName);

            // Bot's Channel-Specific Permissions Check
            const botMember = message.guild.members.me;
            if (!botMember) return;

            // Get effective permissions (combines role permissions and channel overrides)
            const effectivePermissions = botMember.permissionsIn(message.channel);

            // Check for basic messaging permissions
            const requiredBasePerms = [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
            ];

            const missingBasePerms = requiredBasePerms.filter(perm => !effectivePermissions.has(perm));


            if (missingBasePerms.length > 0) {
                try {
                    await message.author.send(
                        `I don't have the required permissions in <#${message.channel.id}>: ${getPermissionArrayNames(missingBasePerms).join(", ")
                        }`,
                    );
                } catch (dmError) {
                    logger.warning("Failed to notify user of missing permissions.");
                }
                return;
            }

            if (command?.inVoiceChannel || command?.inSameVoiceChannel) {
                const voiceChannel = message.member.voice.channel;
                if (voiceChannel) {
                    const voicePermissions = botMember.permissionsIn(voiceChannel);
                    const requiredVoicePerms = [
                        PermissionsBitField.Flags.Connect,
                        PermissionsBitField.Flags.Speak,
                        PermissionsBitField.Flags.ViewChannel,
                    ];

                    const missingVoicePerms = requiredVoicePerms.filter(perm => !voicePermissions.has(perm));
                    if (missingVoicePerms.length > 0) {
                        return await message.reply({
                            embeds: [embedGenerator.error(
                                `I don't have the required permissions in voice channel ${voiceChannel}: ${getPermissionArrayNames(missingVoicePerms).join(", ")}`,
                            )],
                        });
                    }
                }
            }


            // Auto-Correction AFTER permission checks
            if (!command && config.get("autoCommandMatch")) {
                const lastCorrection = autoCorrectCooldowns.get(message.author.id) || 0;
                if (Date.now() - lastCorrection < 10000) return; // 10-second cooldown

                autoCorrectCooldowns.set(message.author.id, Date.now());

                const commandSet = new Set(client.commands.filter(cmd => !cmd.private).map(cmd => cmd.name));
                const commandArray = Array.from(commandSet);
                const closeMatch = findBestMatch(algorithms.LEVENSHTEIN_DISTANCE, commandName, commandArray);

                if (closeMatch.score <= 2 && countCommonChars(commandName, closeMatch.match) !== 0) {
                    await message.reply(`Did you mean \`${prefix}${closeMatch.match}\`?`);

                    const filter = (m) => m.author.id === message.author.id;
                    try {
                        const collected = await message.channel.awaitMessages({ filter, max: 1, time: 5000, errors: ["time"] });
                        if (collected.first()?.content.toLowerCase().startsWith("yes"))
                            command = client.commands.get(closeMatch.match);
                    } catch {
                        return;
                    }
                }
            }

            if (!command) return;

            // User-based Restrictions
            if (command.private && message.author.id !== process.env.OWNER_ID) return;
            if (command.admin && !message.member.permissions.has(PermissionsBitField.Flags.Administrator))
                return await message.reply({ embeds: [embedGenerator.error("You are not an administrator.")] });

            if (command.inVoiceChannel && !message.member?.voice?.channel)
                return await message.reply({ embeds: [embedGenerator.warning("You must be in a voice channel.")] });

            if (command.inSameVoiceChannel && botMember?.voice?.channel && message.member?.voice?.channel?.id !== botMember?.voice?.channel?.id)
                return await message.reply({ embeds: [embedGenerator.warning("You must be in the same voice channel as me.")] });

            // Blacklist Check
            const userBlacklist = await GuildManager.GetBlacklist(message.guild.id);
            if (!userBlacklist.CheckPermission(message.author.id, "cat:text", command.category)) {
                return await message.reply({
                    embeds: [embedGenerator.error(`You are blacklisted from executing commands in the **${command.category}** category.`)],
                });
            }

            if (!userBlacklist.CheckPermission(message.author.id, "cmd:text", command.name)) {
                return await message.reply({
                    embeds: [embedGenerator.error(`You are blacklisted from executing the **${command.name}** command.`)],
                });
            }

            // Database Dependency Check
            if (command.dbNeeded && !dbManager.dbExists()) {
                return await message.reply({
                    embeds: [embedGenerator.error({
                        title: "Cannot run command",
                        description: "A database connection is required to run this command.",
                    })],
                });
            }

            for (const envVariable of command.requiredENVs || []) {
                if (!process.env[envVariable]) 
                {
                    logger.warning(`The required environment variable "${envVariable}" is not set for the command ${command.name}.`);
                    return await message.reply({
                        embeds: [embedGenerator.error({
                            title: "Cannot run command",
                            description: "The command misses a required environment variable",
                        })],
                    });
                }
            }

            if (!config.get("defaultSuperuserState") || !config.get("SUPERUSER_WHITELIST").includes(message.author.id)) {
                // Get or create user cooldowns
                const userCooldowns = TextCooldowns.get(message.author.id) || {};

                // Check command group cooldown FIRST
                if (command.cooldownGroup) {
                    const groupCooldown = userCooldowns[`group:${command.cooldownGroup}`];
                    if (groupCooldown) {
                        const timeLeft = groupCooldown - Date.now();
                        if (timeLeft > 0) {
                            return await message.reply({
                                embeds: [embedGenerator.warning(
                                    `Please wait ${Math.ceil(timeLeft / 1000)} seconds before using commands from the **${command.cooldownGroup}** group.`,
                                )],
                            });
                        }
                    }
                }

                // Then check command-specific cooldown
                const commandCooldown = userCooldowns[command.name];
                if (commandCooldown) {
                    const timeLeft = commandCooldown - Date.now();
                    if (timeLeft > 0) {
                        return await message.reply({
                            embeds: [embedGenerator.warning(
                                `Please wait ${Math.ceil(timeLeft / 1000)} seconds before using ${command.name} again.`,
                            )],
                        });
                    }
                }
            }

            try {
                // Logging
                const maxLengths = {
                    names: Math.max(message.member.user.tag.length, message.channel.name.length, message.guild.name.length),
                    ids: Math.max(message.author.id.length, message.channel.id.length, message.guild.id.length),
                };

                // Logging every executed command
                logger.info(`Executing [${message.content}]` + "\n" +
                    `by    [${message.member.user.tag.padEnd(maxLengths.names)} (${message.author.id.padEnd(maxLengths.ids)})]` + "\n" +
                    `in    [${message.channel.name.padEnd(maxLengths.names)} (${message.channel.id.padEnd(maxLengths.ids)})]` + "\n" +
                    `from  [${message.guild.name.padEnd(maxLengths.names)} (${message.guild.id.padEnd(maxLengths.ids)})]`);

                const startTime = Date.now();

                if (!botMember.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    const commandPerms = [...(command.permissions ?? []), PermissionsBitField.Flags.ReadMessageHistory];

                    const missingPermissions = commandPerms.filter(permission => !effectivePermissions.has(permission));

                    if (missingPermissions.length > 0) {
                        const readablePermissions = getPermissionArrayNames(missingPermissions);
                        return await message.reply({
                            embeds: [embedGenerator.error(
                                `I'm missing the following permissions: ${readablePermissions.map(p => `\`${p}\``).join(", ")
                                }`,
                            )],
                        });
                    }
                }

                if (command.lastExecutionTime >= 1000) await message.channel.sendTyping();

                // Process Optional Arguments
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

                const player = useMainPlayer();

                if (!config.get("defaultSuperuserState") || !config.get("SUPERUSER_WHITELIST").includes(message.author.id)) {
                    const userCooldowns = TextCooldowns.get(message.author.id) || {};
                    const cooldownDuration = command.cooldown || 0;

                    userCooldowns[command.name] = Date.now() + cooldownDuration;
                    if (command.cooldownGroup)
                        userCooldowns[`group:${command.cooldownGroup}`] = Date.now() + cooldownDuration;


                    TextCooldowns.set(message.author.id, userCooldowns);
                }

                await player.context.provide({ guild: message.guild }, async () => {
                    await command.execute(logger, client, message, args, optionalArgs);
                });

                command.lastExecutionTime = Date.now() - startTime;

            } catch (error) {
                logger.error(error);
                return await message.reply({ embeds: [embedGenerator.error("An error occurred while executing the command.")] });
            }
        }
    },
};