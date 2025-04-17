const { Events, PermissionsBitField, MessageFlags } = require("discord.js");
const GuildManager = require("@guildManager");
const { repositories } = require("@utils/db/tableManager.js");
const getExactDate = require("@functions/getExactDate");
const randomMinMax = require("@root/utils/functions/randomMinMax");
const { findBestMatch, algorithms } = require("@utils/algorithms/findBestMatch");
const { initConfFile } = require("@utils/reddit/fetchRedditToken.js");
const countCommonChars = require("@utils/functions/countCommonChars.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const dbManager = require("@root/utils/db/databaseManager");
const { useMainPlayer } = require("discord-player");
const { getPermissionArrayNames } = require("@functions/discordFunctions");
const config = require("@utils/config/configUtils");

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    log: false,
    async execute(client, logger, interaction) {
        // Block bot usage in DMs
        if (!interaction.guild) return;

        const player = useMainPlayer();

        if (interaction.isChatInputCommand()) {
            const SlashCooldowns = client.SlashCooldowns;
            const slash = interaction.client.slashcommands.get(interaction.commandName);

            if (!slash) return;

            // Bot's Channel-Specific Permissions Check
            const botMember = interaction.guild.members.me;
            if (!botMember) return;

            // Get effective permissions (combines role permissions and channel overrides)
            const effectivePermissions = botMember.permissionsIn(interaction.channel);

            // Check for basic messaging permissions
            const requiredBasePerms = [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
            ];

            const missingBasePerms = requiredBasePerms.filter(perm => !effectivePermissions.has(perm));

            if (missingBasePerms.length > 0) {
                try {
                    await interaction.user.send(
                        `I don't have the required permissions in <#${interaction.channel.id}>: ${getPermissionArrayNames(missingBasePerms).join(", ")
                        }`,
                    );
                } catch (dmError) {
                    logger.warning("Failed to notify user of missing permissions.");
                }
                return;
            }

            await interaction.deferReply(); // Defer reply AFTER permission checks

            // Check voice channel permissions if needed
            if (slash?.inVoiceChannel || slash?.inSameVoiceChannel) {
                const voiceChannel = interaction.member.voice.channel;
                if (voiceChannel) {
                    const voicePermissions = botMember.permissionsIn(voiceChannel);
                    const requiredVoicePerms = [
                        PermissionsBitField.Flags.Connect,
                        PermissionsBitField.Flags.Speak,
                        PermissionsBitField.Flags.ViewChannel,
                    ];

                    const missingVoicePerms = requiredVoicePerms.filter(perm => !voicePermissions.has(perm));

                    if (missingVoicePerms.length > 0) {
                        return await interaction.editReply({
                            embeds: [embedGenerator.error(
                                `I don't have the required permissions in voice channel ${voiceChannel}: ${getPermissionArrayNames(missingVoicePerms).join(", ")
                                }`,
                            )],
                        });
                    }
                }
            }

            // Blacklist Check
            const userBlacklist = await GuildManager.GetBlacklist(interaction.guild.id);
            if (!userBlacklist.CheckPermission(interaction.user.id, "cat:text", slash.category)) {
                return await interaction.editReply({
                    embeds: [embedGenerator.error(`You are blacklisted from executing commands in the **${slash.category}** category.`)],
                });
            }
            
            if (!userBlacklist.CheckPermission(interaction.user.id, "cmd:text", slash.name)) {
                return await interaction.editReply({
                    embeds: [embedGenerator.error(`You are blacklisted from executing the **${slash.name}** command.`)],
                });
            }

            // Database Dependency Check
            if (slash.dbNeeded && !dbManager.dbExists()) {
                return await interaction.editReply({
                    embeds: [embedGenerator.error({
                        title: "Cannot run command",
                        description: "A database connection is required to run this command.",
                    })],
                });
            }

            for (const envVariable of slash.requiredENVs || []) {
                if (!process.env[envVariable]) 
                {
                    logger.warning(`The required environment variable "${envVariable}" is not set for the command ${slash.name}.`);
                    return await interaction.editReply({
                        embeds: [embedGenerator.error({
                            title: "Cannot run command",
                            description: "The command misses a required environment variable",
                        })],
                    });
                }
            }

            // Cooldown Check
            if (!config.get("defaultSuperuserState") || !config.get("SUPERUSER_WHITELIST").includes(interaction.user.id)) {
                // Get or create user cooldowns
                const userCooldowns = SlashCooldowns.get(interaction.user.id) || {};

                // Check command group cooldown FIRST
                if (slash.cooldownGroup) {
                    const groupCooldown = userCooldowns[`group:${slash.cooldownGroup}`];
                    if (groupCooldown) {
                        const timeLeft = groupCooldown - Date.now();
                        if (timeLeft > 0) {
                            return await interaction.editReply({
                                embeds: [embedGenerator.warning(
                                    `Please wait ${Math.ceil(timeLeft / 1000)} seconds before using commands from the **${slash.cooldownGroup}** group.`,
                                )],
                            });
                        }
                    }
                }

                // Then check command-specific cooldown
                const commandCooldown = userCooldowns[slash.name];
                if (commandCooldown) {
                    const timeLeft = commandCooldown - Date.now();
                    if (timeLeft > 0) {
                        return await interaction.editReply({
                            embeds: [embedGenerator.warning(
                                `Please wait ${Math.ceil(timeLeft / 1000)} seconds before using ${slash.name} again.`,
                            )],
                        });
                    }
                }
            }

            try {
                const maxLengths = {
                    names: Math.max(interaction.user.tag.length, interaction.channel.name.length, interaction.guild.name.length),
                    ids: Math.max(interaction.user.id.length, interaction.channel.id.length, interaction.guild.id.length),
                };

                // Logging every executed command
                logger.command(`Executing [/${interaction.commandName}]` + "\n" +
                    `by    [${interaction.user.tag.padEnd(maxLengths.names)} (${interaction.user.id.padEnd(maxLengths.ids)})]` + "\n" +
                    `in    [${interaction.channel.name.padEnd(maxLengths.names)} (${interaction.channel.id.padEnd(maxLengths.ids)})]` + "\n" +
                    `from  [${interaction.guild.name.padEnd(maxLengths.names)} (${interaction.guild.id.padEnd(maxLengths.ids)})]`);

                // Additional Bot Permission Check (for required permissions)
                const requiredPermissions = slash.permissions || [];
                requiredPermissions.push(PermissionsBitField.Flags.ReadMessageHistory);

                if (!botMember.permissions.has(PermissionsBitField.Flags.Administrator)) {
                    const commandPerms = slash.permissions || [];
                    commandPerms.push(PermissionsBitField.Flags.ReadMessageHistory);

                    const missingPermissions = commandPerms.filter(perm => !effectivePermissions.has(perm));

                    if (missingPermissions.length > 0) {
                        const readablePermissions = getPermissionArrayNames(missingPermissions);
                        return await interaction.editReply({
                            embeds: [embedGenerator.error(
                                `I'm missing the following permissions: ${readablePermissions.map(p => `\`${p}\``).join(", ")
                                }`,
                            )],
                        });
                    }
                }

                if (!config.get("defaultSuperuserState") || !config.get("SUPERUSER_WHITELIST").includes(interaction.user.id)) {
                    const userCooldowns = SlashCooldowns.get(interaction.user.id) || {};
                    const cooldownDuration = slash.cooldown || 0;

                    userCooldowns[slash.name] = Date.now() + cooldownDuration;
                    if (slash.cooldownGroup)
                        userCooldowns[`group:${slash.cooldownGroup}`] = Date.now() + cooldownDuration;

                    SlashCooldowns.set(interaction.user.id, userCooldowns);
                }

                await player.context.provide({ guild: interaction.guild }, async () => await slash.execute(logger, interaction, client));
            } catch (error) {
                await interaction.editReply({
                    embeds: [embedGenerator.error("An error occurred while executing the command")],
                    flags: MessageFlags.Ephemeral,
                });
                logger.error(error);
            }
        }

        // Autocomplete Handling
        if (interaction.isAutocomplete()) {
            const command = client.slashcommands.get(interaction.commandName);
            if (!command || !command.autocomplete) return;

            try {
                await command.autocomplete(interaction, client);
            } catch (error) {
                logger.error(`Error handling autocomplete for command ${interaction.commandName}:`, error);
            }
        }

        // Context Menu Command Handling
        else if (interaction.isContextMenuCommand()) {
            const context = client.contextcommands.get(interaction.commandName);
            if (!context) return logger.error(`No command matching ${interaction.commandName} was found.`);

            try {
                const maxLengths = {
                    names: Math.max(interaction.user.tag.length, interaction.channel.name.length, interaction.guild.name.length),
                    ids: Math.max(interaction.user.id.length, interaction.channel.id.length, interaction.guild.id.length),
                };

                logger.command(
                    `Executing [${interaction.commandName} (${context.type === 2 ? "User" : "Message"})]` + "\n" +
                    `by    [${interaction.user.tag.padEnd(maxLengths.names)} (${interaction.user.id.padEnd(maxLengths.ids)})]` + "\n" +
                    `in    [${interaction.channel.name.padEnd(maxLengths.names)} (${interaction.channel.id.padEnd(maxLengths.ids)})]` + "\n" +
                    `from  [${interaction.guild.name.padEnd(maxLengths.names)} (${interaction.guild.id.padEnd(maxLengths.ids)})]`);

                if (context.ephemeral) await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                else await interaction.deferReply();

                await player.context.provide({ guild: interaction.guild }, async () => await context.execute(logger, interaction, client));

            } catch (error) {
                await interaction.editReply({
                    embeds: [embedGenerator.error("An error occurred while executing the command")],
                    flags: MessageFlags.Ephemeral,
                });
                logger.error(error);
            }
        }
    },
};