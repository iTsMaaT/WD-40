const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require("discord.js");
const { prettyString } = require("@functions/formattingFunctions");
const embedGenerator = require("@utils/helpers/embedGenerator");
const GuildManager = require("@guildManager");

module.exports = {
    name: "help",
    description: "Lists commands",
    category: "utils",
    private: false,
    usage: {
        required: {
            "command name": "The name of the command to get info of (Optional)",
        },
    },
    async execute(logger, client, message, args, optionalArgs) {
        const prefix = GuildManager.GetPrefix(message.guild);

        // Function to generate the full help embed for a command
        const generateFullCommandEmbed = (command, pref) => {
            const CommandEmbed = {
                title: `**${pref}${command.name}**`,
                color: 0xffffff,
                fields: [{ name: "Description", value: command.description }],
                timestamp: new Date(),
            };

            if (typeof command.usage === "string") {
                CommandEmbed.fields.push({ name: "Options", value: command.description });
            } else if (typeof command.usage === "object") {
                let requiredString = "";
                let optionalString = "";
                let usageString = "";
                if (Object.keys(command.usage.required ?? {}).length) 
                    requiredString += `__Parameters__:\n${Object.keys(command.usage.required).map(key => `${key.toLowerCase()}: ${prettyString(command.usage.required[key], "first", false)}`).join("\n")}`;
                if (Object.keys(command.usage.optional ?? {}).length) 
                    optionalString += `__Flags__:\n${Object.keys(command.usage.optional).map(key => `-${key.split("|")[0].toLowerCase()}${key.split("|").slice(1).length > 0 ? `[${key.split("|").slice(1).join(",").toLowerCase()}]` : ""}${(command.usage.optional[key].hasValue ?? false) ? " <value>" : ""}: ${prettyString(command.usage.optional[key].description, "first", false)}`).join("\n")}`;
                usageString = `${requiredString}${requiredString.length > 0 && optionalString.length > 0 ? "\n" : ""}${optionalString}`;
                CommandEmbed.fields.push({ name: "Options", value: usageString });
                CommandEmbed.footer = { text: "Flags usage explanation: -FlagName[FlagAliase(s)]: FlagDescription" };
            }

            if (command.aliases) CommandEmbed.fields.push({ name: "Aliases", value: command.aliases.join(", ") });
            if (command.examples) {
                const formattedExamples = [];
                command.examples.forEach(ex => {formattedExamples.push(`${prefix}${command.name} ${ex}`);});
                CommandEmbed.fields.push({ name: "Examples", value: formattedExamples.join("\n") });
            }
            if (command.cooldown) CommandEmbed.fields.push({ name: "Cooldown", value: parseInt(command.cooldown) / 1000 + "s" });

            return CommandEmbed;
        };

        if (args[0]) {
            const CommandName = client.commands.get(args[0]);
            if (!CommandName || (CommandName.private && !message.author.id == process.env.OWNER_ID)) return await message.reply({ embeds: [embedGenerator.error("This command doesn't exist.")] });

            const CommandEmbed = generateFullCommandEmbed(CommandName, prefix);
            return message.reply({ embeds: [CommandEmbed] });
        }

        // Logic for generating the category pages and paginated command lists
        let counter = 0;
        const categorymapper = {};
        const addedCommands = new Set(); // Keep track of added commands
        client.commands.each((val) => {
            if (!val.private && !addedCommands.has(val.name)) {
                if (!categorymapper[val.category]) categorymapper[val.category] = {};
                
                categorymapper[val.category][`**${val.name}${val.aliases ? ` [${(val.aliases).join(", ")}]` : ""}: **`] = (prettyString(val.description, "first", true));
                addedCommands.add(val.name);
            }
        });

        const addedSlashCommands = new Set(); // Keep track of added commands
        client.slashcommands.each((val) => {
            if (!addedSlashCommands.has(val.name)) {
                if (!val.category) val.category = "slash";
                if (!categorymapper[val.category]) categorymapper[val.category] = {};
                
                categorymapper[val.category][`**${val.name}${val.aliases ? ` [${(val.aliases).join(", ")}]` : ""}: **`] = (prettyString(val.description, "first", true));
                addedSlashCommands.add(val.name);
            }
        });

        const groupedObject = {};
        Object.keys(categorymapper).forEach(category => {
            const commands = categorymapper[category];
            const commandsArray = Object.entries(commands);
            const chunkSize = Math.ceil(commandsArray.length / Math.ceil(commandsArray.length / 8)); 
             
            for (let i = 0; i < commandsArray.length; i += chunkSize) {
                const chunkCommands = commandsArray.slice(i, i + chunkSize);
                const chunkedCategory = `${category} (${Math.floor(i / chunkSize) + 1})`;
    
                groupedObject[chunkedCategory] = chunkCommands.map(([name, value]) => ({ name, value }));
            }
        });

        const categories = Object.keys(groupedObject);

        const FisrtPage = new ButtonBuilder()
            .setCustomId("first")
            .setLabel("◀◀")
            .setStyle(ButtonStyle.Success);

        const LastPage = new ButtonBuilder()
            .setCustomId("last")
            .setLabel("▶▶")
            .setStyle(ButtonStyle.Success);

        const NextPage = new ButtonBuilder()
            .setCustomId("next")
            .setLabel("▶")
            .setStyle(ButtonStyle.Primary);

        const PreviousPage = new ButtonBuilder()
            .setCustomId("previous")
            .setLabel("◀")
            .setStyle(ButtonStyle.Primary);

        const PageNumber = new ButtonBuilder()
            .setCustomId("page")
            .setLabel(`${counter} / ${categories.length}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);

        const row = new ActionRowBuilder()
            .addComponents(FisrtPage, PreviousPage, PageNumber, NextPage, LastPage);

        const pages = [];
        categories.map((category, index) => {
            const categoryName = category.split(" ")[0]; // Get the category name
            if (index === 0 || categoryName !== categories[index - 1].split(" ")[0]) 
                pages.push(`**Page ${index + 1}:** ${categoryName.toUpperCase()}`);
        });

        const categoryEmbed = {
            title: "Command categories",
            description: 
            `**The prefix is:** \`${prefix}\`\n` +
            "Support server: https://discord.gg/pqKE2QZrFM\n\n" + 
            "**Commands usage:**\n" +
            "Parameters are the arguments you pass to the command, flags are the options you can pass to the command.\n" +
            "Paramters are somtimes required, flags are always optional.\n\n" +
            "To pass a parameter, you must type it after the command name, for example:\n" +
            `\`${prefix}play https://www.youtube.com/watch?v=dQw4w9WgXcQ\`\n\n` +
            "To pass a flag, you must type it after the command name, and prefix it with a dash (-), for example:\n" +
            `\`${prefix}play https://www.youtube.com/watch?v=dQw4w9WgXcQ -shuffle\`\n\n` +
            `Certain flags need a value, it is explained in the commands help page. (like ${prefix}help play)\n\n` +
            `Total commands: ${addedCommands.size}\n${pages.join("\n")}`,
            color: 0xffffff,
            footer: { text: "Buttons expire after 2 minutes." },
        };
              

        row.components[0].setDisabled(true);
        row.components[1].setDisabled(true);
        const helpMessage = await message.reply({
            embeds: [categoryEmbed],
            components: [row],
            allowedMentions: { repliedUser: false },
        });

        const filter = (interaction) => {
            if (interaction.user.id == message.author.id) return true;
        };

        const collector = helpMessage.createMessageComponentCollector({
            filter,
            time: 120000,
            dispose: true,
        });
        
        let embed = categoryEmbed;
        collector.on("collect", async (interaction) => {
            try {
                let commandPrefix = prefix;
                if (interaction.customId === "command_select") {
                    const commandName = interaction.values[0].replace(/[*:[\] ]/g, ""); // Retrieve selected command
                    
                    const command = categories[counter - 1].includes("slash") ? client.slashcommands.get(commandName) : client.commands.get(commandName);
                    if (categories[counter - 1].includes("slash")) commandPrefix = "/";
                    
                    
                    if (command) {
                        const fullCommandEmbed = generateFullCommandEmbed(command, commandPrefix);
                        await interaction.deferReply({ ephemeral: true });
                        await interaction.followUp({
                            embeds: [fullCommandEmbed],
                            ephemeral: true,
                        });
                        return;
                    }
                }

                if (interaction.customId === "next") 
                    counter++;
                else if (interaction.customId === "previous") 
                    counter--;
                else if (interaction.customId === "first") 
                    counter = 0;
                else if (interaction.customId === "last") 
                    counter = categories.length;
                
                if (counter < 0) counter = 0;
                if (counter >= categories.length) counter = categories.length;
        
                // Update the label to show the current page number
                row.components[2].setLabel(`${counter} / ${categories.length}`);
        
                if (counter == 0) {
                    embed = categoryEmbed;
        
                    await row.components[0].setDisabled(counter == 0);
                    await row.components[1].setDisabled(counter == 0);
                    await row.components[3].setDisabled(counter == categories.length);
                    await row.components[4].setDisabled(counter == categories.length);

                            
                    // Edit the message with the new embed and components
                    await helpMessage.edit({
                        embeds: [embed],
                        components: [row],
                    });
        
                    // Respond to the interaction
                    await interaction.update({
                        embeds: [embed],
                        components: [row],
                    });
                } else {
                    const currentCategory = categories[counter - 1];
                    const commandsInCategory = groupedObject[currentCategory];
                    embed = {
                        title: `Commands for category: ${currentCategory.toUpperCase().replace(" (1)", "")}`,
                        fields: commandsInCategory,
                        color: 0xffffff,
                    };
        
                    // Create a select menu for the current page's commands
                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId("command_select")
                        .setPlaceholder("Select a command")
                        .addOptions(commandsInCategory.map(command => ({
                            label: command.name.match(/([a-zA-Z0-9]+)/g)[0],
                            description: command.value,
                            value: command.name.match(/([a-zA-Z0-9]+)/g)[0],
                        })));
        
                    const selectRow = new ActionRowBuilder().addComponents(selectMenu);
        
                    await row.components[0].setDisabled(counter == 0);
                    await row.components[1].setDisabled(counter == 0);
                    await row.components[3].setDisabled(counter == categories.length);
                    await row.components[4].setDisabled(counter == categories.length);
        
                    // Edit the message with the new embed and components
                    await helpMessage.edit({
                        embeds: [embed],
                        components: [row, selectRow],
                        allowedMentions: { repliedUser: false },
                    });
        
                    // Respond to the interaction
                    await interaction.update({
                        embeds: [embed],
                        components: [row, selectRow],
                    });
                }
            } catch (error) {
                logger.error("Error during interaction:", error);
            }
        });

        collector.on("end", async () => {
            row.components.forEach(component => {
                component.setDisabled(true);
            });
            await helpMessage.edit({
                embeds: [embed],
                components: [row],
                allowedMentions: { repliedUser: false },
            });
        });
    },
};