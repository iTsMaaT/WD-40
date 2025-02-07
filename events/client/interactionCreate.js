const { Events, PermissionsBitField, MessageFlags } = require("discord.js");
const GuildManager = require("@guildManager");
const { repositories } = require("@utils/db/tableManager.js");
const getExactDate = require("@functions/getExactDate");
const RandomMinMax = require("@root/utils/functions/randomMinMax");
const { findBestMatch, algorithms } = require("@utils/algorithms/findBestMatch");
const { initConfFile } = require("@utils/reddit/fetchRedditToken.js");
const countCommonChars = require("@utils/functions/countCommonChars.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const dbManager = require("@root/utils/db/databaseManager");
const { useMainPlayer } = require("discord-player");

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
            
            const botPermissions = botMember.permissionsIn(interaction.channel);

            if (!botPermissions.has(PermissionsBitField.Flags.ViewChannel) || !botPermissions.has(PermissionsBitField.Flags.SendMessages)) {
                try {
                    await interaction.user.send(`I don't have permission to send messages in <#${interaction.channel.id}>.`);
                } catch (dmError) {
                    logger.warning("Failed to notify user of missing permissions.");
                }
                return;
            }

            await interaction.deferReply(); // Defer reply AFTER permission checks

            // Blacklist Check
            const userBlacklist = await GuildManager.GetBlacklist(interaction.guild.id);
            if (!userBlacklist.CheckPermission(interaction.user.id, slash.category) || !userBlacklist.CheckPermission(interaction.user.id, slash.name)) {
                return await interaction.editReply({
                    embeds: [embedGenerator.error("You are blacklisted from executing this command.")],
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

            // Cooldown Check
            if (SlashCooldowns.has(interaction.user.id)) {
                const cooldown = SlashCooldowns.get(interaction.user.id);
                const timeLeft = cooldown - Date.now();
                if (timeLeft > 0) {
                    return await interaction.editReply({
                        embeds: [embedGenerator.warning(`Please wait ${Math.ceil(timeLeft / 1000)} seconds before using that command again.`)],
                    });
                }
            }

            // Set command cooldown AFTER all checks pass
            SlashCooldowns.set(interaction.user.id, Date.now() + (slash.cooldown || 0));

            try {
                const maxLengths = {
                    names: Math.max(interaction.user.tag.length, interaction.channel.name.length, interaction.guild.name.length),
                    ids: Math.max(interaction.user.id.length, interaction.channel.id.length, interaction.guild.id.length),
                };

                // Logging every executed command
                logger.info(`Executing [/${interaction.commandName}]` + "\n" +
                    `by    [${interaction.user.tag.padEnd(maxLengths.names)} (${interaction.user.id.padEnd(maxLengths.ids)})]` + "\n" +
                    `in    [${interaction.channel.name.padEnd(maxLengths.names)} (${interaction.channel.id.padEnd(maxLengths.ids)})]` + "\n" +
                    `from  [${interaction.guild.name.padEnd(maxLengths.names)} (${interaction.guild.id.padEnd(maxLengths.ids)})]`);

                // Additional Bot Permission Check (for required permissions)
                const requiredPermissions = slash.permissions || [];
                requiredPermissions.push(PermissionsBitField.Flags.ReadMessageHistory);

                if (!botPermissions.has(PermissionsBitField.Flags.Administrator)) {
                    const missingPermissions = requiredPermissions.filter(permission => !botPermissions.has(permission));
                    if (missingPermissions.length > 0) {
                        const readablePermissions = missingPermissions.map(p => PermissionsBitField.Flags[p] || `Unknown (${p})`);
                        return await interaction.editReply({
                            embeds: [embedGenerator.error(`The bot is missing the following permissions: ${readablePermissions.map(p => `\`${p}\``).join(", ")}`)],
                        });
                    }
                }

                // Execute the slash command
                await player.context.provide({ guild: interaction.guild }, async () => await slash.execute(logger, interaction, client));

            } catch (error) {
                await interaction.editReply({
                    embeds: [embedGenerator.error("An error occurred while executing the command")],
                    flags: MessageFlags.Ephemeral,
                });
                logger.error(`Error executing slash command [${interaction.commandName}]:`, error);
            }
        } 

        // Context Menu Command Handling
        else if (interaction.isContextMenuCommand()) {
            const context = client.contextCommands.get(interaction.commandName);
            if (!context) return logger.error(`No command matching ${interaction.commandName} was found.`);

            try {
                const maxLengths = {
                    names: Math.max(interaction.user.tag.length, interaction.channel.name.length, interaction.guild.name.length),
                    ids: Math.max(interaction.user.id.length, interaction.channel.id.length, interaction.guild.id.length),
                };

                logger.info(`
                Executing [${interaction.commandName} (${context.type === 2 ? "User" : "Message"})]
                by   [${interaction.user.tag.padEnd(maxLengths.names)} (${interaction.user.id.padEnd(maxLengths.ids)})]
                in   [${interaction.channel.name.padEnd(maxLengths.names)} (${interaction.channel.id.padEnd(maxLengths.ids)})]
                from [${interaction.guild.name.padEnd(maxLengths.names)} (${interaction.guild.id.padEnd(maxLengths.ids)})]`
                    .replace(/^\s+/gm, "")); // Removes leading whitespace from log lines

                if (context.ephemeral) await interaction.deferReply({ flags: MessageFlags.Ephemeral });
                else await interaction.deferReply();

                await player.context.provide({ guild: interaction.guild }, async () => await context.execute(logger, interaction, client));

            } catch (error) {
                await interaction.editReply({
                    embeds: [embedGenerator.error("An error occurred while executing the command")],
                    flags: MessageFlags.Ephemeral,
                });
                logger.error(`Error executing context menu command [${interaction.commandName}]:`, error);
            }
        }
    },
};