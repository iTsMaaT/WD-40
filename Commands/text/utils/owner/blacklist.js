const SendErrorEmbed = require("../../../../utils/functions/SendErrorEmbed");
const id = require("../../../../utils/functions/id");

module.exports = {
    name: 'blacklist',
    description: 'Blacklist a user from using commands',
    usage: "< ID: ID of the user to blacklist, Permission: command or category to blacklist the user from >",
    category: 'utils',
    async execute(logger, client, message, args) {
        if (!args[0]) return SendErrorEmbed(message, "You did not provide a user.", "yellow");
        if (!args[1]) return SendErrorEmbed(message, "You did not provide a permission.", "yellow");
        let target = "";
        let owner = "";

        const executor = await message.guild.members.fetch(message.author.id);
        const permission = args[1];

        const commandSet = new Set();
        client.commands.filter(command => !command.private).forEach((command) => {
            commandSet.add(command.name);
            commandSet.add(command.category);
        });
        const commandArray = Array.from(commandSet);
        
        try {
            target = await message.guild.members.fetch(id(args[0]));
            owner = await message.guild.fetchOwner();
        } catch(err) {
            return SendErrorEmbed(message, "Couldn't find the user", "yellow");
        }
        if (!commandArray.includes(permission)) return SendErrorEmbed(message, "Invalid permission, must be a category or command name.", "yellow");

        if (target.id == executor.id) return SendErrorEmbed(message, "You cannot blacklist yourself", "yellow");
        if (target.id == owner.id) return SendErrorEmbed(message, "You cannot blacklist the guild's owner", "yellow");
        if (executor.permissions.has("Administrator") && target.permissions.has("Administrator")) return SendErrorEmbed(message, "You cannot blacklist another server admin", "yellow");
        if (!executor.permissions.has("Administrator")) return SendErrorEmbed(message, "You must be a server admin to execute that command", "yellow");
       
        const embed = {
            color: 0xffffff,
            title: `Blaclist`,
            timestamp: new Date(),
        };

        const blacklist = await GuildManager.GetBlacklist(message.guild.id);
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