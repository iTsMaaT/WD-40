const { Events, PermissionsBitField } = require("discord.js");
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
        const player = useMainPlayer();

        if (interaction.isChatInputCommand()) {
            await interaction.deferReply();
            const SlashCooldowns = client.SlashCooldowns;

            const slash = interaction.client.slashcommands.get(interaction.commandName);
    
            if (!slash) return logger.error(`No command matching ${interaction.commandName} was found.`);

            const userBlacklist = await GuildManager.GetBlacklist(interaction.guild.id);
            const blCategory = !userBlacklist.CheckPermission(interaction.user.id, slash.category);
            const blCommand = !userBlacklist.CheckPermission(interaction.user.id, slash.name);
            if (blCategory || blCommand) 
                return await interaction.editReply({ embeds: [embedGenerator.error(`You are blacklisted from executing ${blCategory ? `commands in the **${command.category}** category` : `the **${command.name}** command`}.`)] });
    
            if (slash.dbNeeded && !dbManager.dbExists()) {
                return await interaction.editReply({ embeds: [embedGenerator.error({
                    title: "Cannot run command",
                    description: "A database connection is required to run this command.",
                })] });}

            // Check command cooldown
            if (SlashCooldowns.has(interaction.user.id)) {
                const cooldown = SlashCooldowns.get(interaction.user.id);
                const timeLeft = cooldown - Date.now();
                if (timeLeft > 0) {
                    interaction.reply({ embeds: [embedGenerator.warning(`Please wait ${Math.ceil(timeLeft / 1000)} seconds before using that command again.`)] });
                    return;
                }
            }
    
            // Set command cooldown
            const cooldownTime = slash.cooldown || 0;
            SlashCooldowns.set(interaction.user.id, Date.now() + cooldownTime);
    
            try {

                const maxLengths = {
                    names: Math.max(interaction.user.tag.length, interaction.channel.name.length, interaction.guild.name.length),
                    ids: Math.max(interaction.user.id.length, interaction.channel.id.length, interaction.guild.id.length),
                };

                // Logging every executed commands
                logger.info(`Executing [/${interaction.commandName}]` + "\n" +
                    `by    [${interaction.user.tag.padEnd(maxLengths.names)} (${interaction.user.id.padEnd(maxLengths.ids)})]` + "\n" +
                    `in    [${interaction.channel.name.padEnd(maxLengths.names)} (${interaction.channel.id.padEnd(maxLengths.ids)})]` + "\n" +
                    `from  [${interaction.guild.name.padEnd(maxLengths.names)} (${interaction.guild.id.padEnd(maxLengths.ids)})]`);

                                        
                const botMember = interaction.guild.members.me;
                if (!botMember) return;

                const botPermissions = botMember.permissions;
                    
                if (!botPermissions.has(PermissionsBitField.Flags.SendMessages || !botPermissions.has(PermissionsBitField.Flags.ViewChannel))) return;

                const requiredPermissions = slash.permissions || [];
                requiredPermissions.push(PermissionsBitField.Flags.ReadMessageHistory);

                if (requiredPermissions.length > 1 && !botPermissions.has(PermissionsBitField.Flags.Administrator)) {
                    const missingPermissions = requiredPermissions.filter(permission => !botPermissions.has(permission));
                    if (missingPermissions.length > 0) 
                        return await message.editReply({ embeds: [embedGenerator.error(`The bot is missing the following permissions: ${missingPermissions.join(", ")}`)] });
                }

                // execute the slash command
                await player.context.provide({ guild: interaction.guild }, () => slash.execute(logger, interaction, client));
    
            } catch (error) {
                await interaction.editReply({
                    embeds: [embedGenerator.error("An error occured while executing the command")],
                    ephemeral: true,
                });    
                logger.event(`Error executing slash command [${interaction.commandName}]`);
                logger.error(error);
            }
        } else if (interaction.isContextMenuCommand()) {
            await interaction.deferReply({ ephemeral: true });
            
            const context = client.contextCommands.get(interaction.commandName);
    
            if (!context) return logger.error(`No command matching ${interaction.commandName} was found.`);
    
            try {
                await player.context.provide({ guild: interaction.guild }, async () => await context.execute(logger, interaction, client));
    
                const maxLengths = {
                    names: Math.max(interaction.user.tag.length, interaction.channel.name.length, interaction.guild.name.length),
                    ids: Math.max(interaction.user.id.length, interaction.channel.id.length, interaction.guild.id.length),
                };

                logger.info(`
                Executing [${interaction.commandName} (${context.type === 2 ? "User" : "Message"})]
                by   [${interaction.user.tag.padEnd(maxLengths.names)} (${interaction.user.id.padEnd(maxLengths.ids)})]
                in   [${interaction.channel.name.padEnd(maxLengths.names)} (${interaction.channel.id.padEnd(maxLengths.ids)})]
                from [${interaction.guild.name.padEnd(maxLengths.names)} (${interaction.guild.id.padEnd(maxLengths.ids)})]`
                    .replace(/^\s+/gm, ""));
    
            } catch (error) {
                await interaction.editReply({
                    embeds: [embedGenerator.error("An error occured while executing the command")],
                    ephemeral: true,
                });
                
                logger.event(`Error executing context menu command [${interaction.commandName}]`);
                logger.error(error);
            }
        }
    },
};