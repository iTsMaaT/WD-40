const { Events, PermissionsBitField } = require("discord.js");
const GuildManager = require("@root/utils/GuildManager");
const { repositories } = require("@utils/db/tableManager.js");
const getExactDate = require("@functions/getExactDate");
const RandomMinMax = require("@functions/RandomMinMax");
const findClosestMatch = require("@utils/algorithms/findClosestMatch.js");
const { initConfFile } = require("@utils/reddit/fetchRedditToken.js");
const countCommonChars = require("@utils/functions/countCommonChars.js");
const { activities, blacklist, whitelist, DefaultSuperuserState, DefaultDebugState, AutoCommandMatch } = require("@utils/config.json");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: Events.InteractionCreate,
    once: false,
    log: false,
    async execute(client, logger, interaction) {
        if (interaction.isChatInputCommand()) {
            await interaction.deferReply();
            const SlashCooldowns = client.SlashCooldowns;

            const slash = interaction.client.slashcommands.get(interaction.commandName);
    
            if (!slash) return logger.error(`No command matching ${interaction.commandName} was found.`);

            const userBlacklist = await GuildManager.GetBlacklist(message.guild.id);
            const blCategory = !userBlacklist.CheckPermission(message.author.id, command.category);
            const blCommand = !userBlacklist.CheckPermission(message.author.id, command.name);
            if (blCategory || blCommand) 
                return await message.editReply({ embeds: [embedGenerator.error(`You are blacklisted from executing ${blCategory ? `commands in the **${command.category}** category` : `the **${command.name}** command`}.`)] });
    
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

                // Logging the command
                logger.info(`
            Executing [/${interaction.commandName}]
            by    [${interaction.user.tag} (${interaction.user.id})]
            in    [${interaction.channel.name} (${interaction.channel.id})]
            from  [${interaction.guild.name} (${interaction.guild.id})]`
                    .replace(/^\s+/gm, ""));
                                        
                const botMember = message.guild.members.me;
                if (!botMember) return;

                const botPermissions = botMember.permissions;
                    
                if (!botPermissions.has(PermissionsBitField.Flags.SendMessages)) return;

                const requiredPermissions = slash.permissions || [];

                if (requiredPermissions.length > 0 && !botPermissions.has(PermissionsBitField.Flags.Administrator)) {
                    const missingPermissions = requiredPermissions.filter(permission => !botPermissions.has(permission));
                    if (missingPermissions.length > 0) 
                        return await message.editReply({ embeds: [embedGenerator.error(`The bot is missing the following permissions: ${missingPermissions.join(", ")}`)] });
                }

                // execute the slash command
                await slash.execute(logger, interaction, client);
    
            } catch (error) {
                await interaction.editReply({
                    embeds: [embedGenerator.error("An error occured while executing the command")],
                    ephemeral: true,
                });    
                logger.error(`Error executing slash command [${interaction.commandName}]`);
                logger.error(error.stack);
            }
        } else if (interaction.isContextMenuCommand()) {
            await interaction.deferReply({ ephemeral: true });
            
            const context = client.contextCommands.get(interaction.commandName);
    
            if (!context) return logger.error(`No command matching ${interaction.commandName} was found.`);
    
            try {
                await context.execute(logger, interaction, client);
    
                logger.info(`
                Executing [${interaction.commandName} (${context.type === 2 ? "User" : "Message"})]
                by   [${interaction.user.tag} (${interaction.user.id})]
                in   [${interaction.channel.name} (${interaction.channel.id})]
                from [${interaction.guild.name} (${interaction.guild.id})]`
                    .replace(/^\s+/gm, ""));
    
            } catch (error) {
                await interaction.editReply({
                    embeds: [embedGenerator.error("An error occured while executing the command")],
                    ephemeral: true,
                });
                
                logger.error(`Error executing context menu command [${interaction.commandName}]`);
                logger.error(error);
            }
        }
    },
};