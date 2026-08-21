const {  id } = require("@functions/discordFunctions");
const { PermissionsBitField } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const GuildManager = require("@guildManager");

module.exports = {
    name: "blacklist",
    description: "Blacklist a user from using commands (defaults to blacklisting the command)",
    extendedDescription: "Blacklist a user from using commands, if category or command option is not provided, will blacklist the command",
    admin: true,
    usage: {
        required: {
            "ID": "ID of the user to blacklist",
            "Type": "The type of command to blacklist (text, slash, context)",
            "Name": "The name of the command to blacklist",
        },
        optional: {
            "category|cat": {
                hasValue: false,
                description: "Blacklisting a category",
            },
            "command|cmd": {
                hasValue: false,
                description: "blacklisting a command",
            },
            "list|l": {
                hasValue: false,
                description: "Lists a users blacklist",
            },
        },
    },
    category: "admin",
    examples: [
        "1081004946872352958 text moveall -cmd",
        "1081004946872352958 -cat text music",
        "1081004946872352958 slash reddit",
    ],
    dbNeeded: true,
    async execute(logger, client, message, args, flags) {
        const blacklist = await GuildManager.GetBlacklist(message.guild.id);
        const list = flags["list|l"];

        if (list) {
            let target;
            if (args[0]) target = await message.guild.members.fetch(id(args[0])); 
            else target = message.author;

            const userBlacklistObject = blacklist.GetPermissions(target.id);
            if (!userBlacklistObject || Object.values(userBlacklistObject).every(arr => arr.length === 0)) 
                return await message.reply({ embeds: [embedGenerator.warning(`No blacklist for ${target.user.displayName}`)] });


            const embed = embedGenerator.info({
                title: `Blacklist for ${target.user.displayName}`,
                fields: [],
            });
            
            const formatCategory = (category) => {
                return category
                    .replace(/([a-z])([A-Z])/g, "$1 $2") // Split at uppercase letters
                    .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
            };

            Object.entries(userBlacklistObject).forEach(([category, commands]) => {
                if (commands.length > 0) 
                    embed.data.fields.push({ name: formatCategory(category), value: commands.join(", "), inline: false });
                
            });

            return await message.reply({ embeds: [embed] });
        }
        if (!args[0]) return await message.reply({ embeds: [embedGenerator.warning("You did not provide a user.")] });
        if (!args[1]) return await message.reply({ embeds: [embedGenerator.warning("You did not provide the type of command to blacklist.")] });
        if (!args[2]) return await message.reply({ embeds: [embedGenerator.warning("You did not provide the name of the command to blacklist.")] });
        if (flags["category|cat"] && flags["command|cmd"]) return await message.reply({ embeds: [embedGenerator.warning("You cannot blacklist a command and category at the same time.")] });
        if (!["text", "slash", "context"].includes(args[1].toLowerCase())) return await message.reply({ embeds: [embedGenerator.warning("Invalid command / category type.")] });
        const blacklistCategory = Boolean(flags["category|cat"]);
        const blacklistCommand = Boolean(flags["command|cmd"]) || !blacklistCategory;
        let target, owner;

        const executor = await message.guild.members.fetch(message.author.id);
        const blacklisting = blacklistCommand ? "cmd" : "cat";
        const type = args[1].toLowerCase();
        const name = args[2];

        const commandSet = new Set();
        const commandCategorySet = new Set();

        [
            { prefix: "text", commands: client.commands },
            { prefix: "slash", commands: client.slashcommands },
            { prefix: "context", commands: client.contextcommands },
        ].forEach(({ prefix, commands }) => {
            commands.forEach((cmd) => {
                if (!cmd.private) {
                    commandSet.add(`${prefix}:${cmd.name}`);
                    if (cmd.category) commandCategorySet.add(`${prefix}:${cmd.category}`);
                }
            });
        });

        try {
            target = await message.guild.members.fetch(id(args[0]));
            owner = await message.guild.fetchOwner();
        } catch (err) {
            return await message.reply({ embeds: [embedGenerator.error("Couldn't find the specified user")] });
        }
        
        const isCategory = commandCategorySet.has(`${type}:${name}`) && blacklistCategory;
        const isCommand = commandSet.has(`${type}:${name}`) && blacklistCommand;

        if (!isCommand && !isCategory) 
            return await message.reply({ embeds: [embedGenerator.warning(`Invalid ${blacklisting == "cmd" ? "command" : "category"}, refer to help for a list of commands and categories.`)] });

        
        if (target.id == executor.id) return await message.reply({ embeds: [embedGenerator.warning("You cannot blacklist yourself")] });
        if (target.id == owner.id) return await message.reply({ embeds: [embedGenerator.warning("You cannot blacklist the guild's owner")] });
        if (target.permissions.has(PermissionsBitField.Flags.Administrator)) return await message.reply({ embeds: [embedGenerator.warning("You cannot blacklist another server admin")] });
        
        const embed = {
            color: 0xffffff,
            title: "Blacklist",
            fields: [],
            timestamp: new Date(),
        };

        if (blacklist.CheckPermission(target.id, `${blacklisting}:${type}`, name)) {
            blacklist.DenyPermission(target.id, `${blacklisting}:${type}`, name);
            embed.description = `You blacklisted <@${target.id}> (${target.id}) from executing ${isCategory ? `commands in the **${name}** category` : `the **${name}** command`}.`;
        } else {
            blacklist.GrantPermission(target.id, `${blacklisting}:${type}`, name);
            embed.description = `You granted permission for <@${target.id}> (${target.id}) to execute ${isCategory ? `commands in the **${name}** category` : `the **${name}** command`}.`;
        }

        await message.reply({ embeds: [embed] });
    },
};