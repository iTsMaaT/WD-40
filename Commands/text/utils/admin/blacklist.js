const SendErrorEmbed = require("@functions/SendErrorEmbed");
const id = require("@functions/id");
const { PermissionsBitField } = require('discord.js');

module.exports = {
    name: 'blacklist',
    description: 'Blacklist a user from using commands',
    usage: "< ID: ID of the user to blacklist, Permission: command or category to blacklist the user from >",
    category: 'admin',
    async execute(logger, client, message, args) {
        if (!args[0]) return SendErrorEmbed(message, "You did not provide a user.", "yellow");
        let target, owner;

        const executor = await message.guild.members.fetch(message.author.id);
        const permission = args[1];

        const commandSet = new Set();
        const commandCategorySet = new Set();
        client.commands.filter(command => !command.private).forEach((command) => {
            commandSet.add(command.name);
            commandCategorySet.add(command.category);
        });
        const commandArray = [...Array.from(commandSet), ...Array.from(commandCategorySet)];
        
        try {
            target = await message.guild.members.fetch(id(args[0]));
            owner = await message.guild.fetchOwner();
        } catch(err) {
            return SendErrorEmbed(message, "Couldn't find the specified user", "yellow");
        }
        if (!commandArray.includes(permission) && permission) return SendErrorEmbed(message, "Invalid permission, must be a category or command name.", "yellow");
        
        if (target.id == executor.id) return SendErrorEmbed(message, "You cannot blacklist yourself", "yellow");
        if (target.id == owner.id) return SendErrorEmbed(message, "You cannot blacklist the guild's owner", "yellow");
        if (executor.permissions.has(PermissionsBitField.Flags.Administrator) && target.permissions.has(PermissionsBitField.Flags.Administrator)) return SendErrorEmbed(message, "You cannot blacklist another server admin", "yellow");
        if (!executor.permissions.has(PermissionsBitField.Flags.Administrator)) return SendErrorEmbed(message, "You must be a server admin to execute that command", "yellow");
        
        const embed = {
            color: 0xffffff,
            title: `Blacklist`,
            fields: [],
            timestamp: new Date(),
        };
        
        const blacklist = await GuildManager.GetBlacklist(message.guild.id);
        if (!args[1]) {
            const BlacklistedCommandsArray = [];
            const BlacklistedCategoriesArray = [];
            const PermissionsBlacklist = blacklist.GetPermissions(target.id);
            if (!PermissionsBlacklist) embed.description = `This user is not blacklisted`;
            else {
                for (entry of PermissionsBlacklist) {
                    if (commandSet.has(entry.trim())) BlacklistedCommandsArray.push(entry.trim());
                    if (commandCategorySet.has(entry.trim())) BlacklistedCategoriesArray.push(entry.trim());
                }
                if (BlacklistedCategoriesArray[0]) embed.fields.push({ name: "Blacklisted categories", value: BlacklistedCategoriesArray.join(", ")});
                if (BlacklistedCommandsArray[0]) embed.fields.push({ name: "Blacklisted commands", value: BlacklistedCommandsArray.join(", ")});
            }
            embed.title = "Blacklist for " + target.user.username;
            return message.reply({ embeds: [embed]});
        }

        if (blacklist.CheckPermission(target.id, permission)) {
            blacklist.DenyPermission(target.id, permission);
            const blCategory = !blacklist.CheckPermission(message.author.id, permission);
            embed.description = `You blaclisted <@${target.id}> (${target.id}) from executing ${!blCategory ? `commands in the **${permission}** category` : `the **${permission}** command`}.`;
        } else {
            blacklist.GrantPermission(target.id, permission);
            const blCategory = !blacklist.CheckPermission(message.author.id, permission);
            embed.description = `You granted permission for <@${target.id}> (${target.id}) to execute ${!blCategory ? `commands in the **${permission}** category` : `the **${permission}** command`}.`;
        }
        message.reply({ embeds: [embed]});
    }
};