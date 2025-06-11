const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ApplicationCommandOptionType, MessageFlags } = require("discord.js");
const { prettyString } = require("@functions/formattingFunctions");
const embedGenerator = require("@utils/helpers/embedGenerator");
const GuildManager = require("@guildManager");
const { findBestMatch, algorithms } = require("@utils/algorithms/findBestMatch");

module.exports = {
    name: "help",
    description: "Lists commands",
    options: [
        {
            name: "command",
            type: ApplicationCommandOptionType.String,
            description: "Get help for a specific command",
            required: false,
            autocomplete: true,
        },
    ],
    async autocomplete(interaction, client) {
        const focusedValue = interaction.options.getFocused() || "help";
        const addedSlashCommands = new Set();
        client.slashcommands.each((val) => {
            if (!val.private && !addedSlashCommands.has(val.name)) 
                addedSlashCommands.add(val.name);
        });
        const addedCommands = new Set();
        client.commands.each((val) => {
            if (!val.private && !addedCommands.has(val.name)) 
                addedCommands.add(val.name);
        });
        allCommands = new Set([...addedSlashCommands, ...addedCommands]);
        const matches = findBestMatch(algorithms.SLICED_LEVENSHTEIN_DISTANCE, focusedValue, [...allCommands]);
        console.log(matches);

        await interaction.respond(
            matches.matches
                .filter(match => match.score > 0.4)
                .slice(0, 5)
                .map(match => ({
                    name: match.value,
                    value: match.value,
                })),
        );
    },
    async execute(logger, interaction, client) {
        const prefix = GuildManager.GetPrefix(interaction.guild);

        const generateFullCommandEmbed = (command, pref) => {
            const CommandEmbed = {
                title: `**${pref}${command.name}**`,
                color: 0xffffff,
                fields: [{ name: "Description", value: command.extendedDescription || command.description }],
                timestamp: new Date(),
            };

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

            if (command.aliases) CommandEmbed.fields.push({ name: "Aliases", value: command.aliases.join(", ") });
            if (command.examples) {
                const formattedExamples = [];
                command.examples.forEach(ex => {formattedExamples.push(`${pref}${command.name} ${ex}`);});
                CommandEmbed.fields.push({ name: "Examples", value: formattedExamples.join("\n") });
            }
            if (command.cooldown) CommandEmbed.fields.push({ name: "Cooldown", value: parseInt(command.cooldown) / 1000 + "s" });

            return CommandEmbed;
        };

        const commandName = interaction.options.getString("command");
        if (commandName) {
            const CommandName = client.commands.get(commandName) || client.slashcommands.get(commandName);
            if (!CommandName || (CommandName.private && interaction.user.id !== process.env.OWNER_ID)) 
                return await interaction.editReply({ embeds: [embedGenerator.error("This command doesn't exist.")] });
            

            const CommandEmbed = generateFullCommandEmbed(CommandName, CommandName.category === "slash" ? "/" : prefix);
            return interaction.editReply({ embeds: [CommandEmbed] });
        }

        let counter = 0;
        const categorymapper = {};
        const addedCommands = new Set();
        client.commands.each((val) => {
            if (!val.private && !addedCommands.has(val.name)) {
                if (!categorymapper[val.category]) categorymapper[val.category] = {};
                
                categorymapper[val.category][`**${val.name}${val.aliases ? ` [${(val.aliases).join(", ")}]` : ""}: **`] = (prettyString(val.description, "first", true));
                addedCommands.add(val.name);
            }
        });

        const addedSlashCommands = new Set();
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
            const categoryName = category.split(" ")[0];
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
            "Paramters are sometimes required, flags are always optional.\n\n" +
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
        const helpMessage = await interaction.editReply({
            embeds: [categoryEmbed],
            components: [row],
        });

        const filter = (i) => i.user.id === interaction.user.id;

        const collector = helpMessage.createMessageComponentCollector({
            filter,
            time: 120000,
        });

        let embed = categoryEmbed;
        collector.on("collect", async (i) => {
            try {
                let commandPrefix = prefix;
                if (i.customId === "command_select") {
                    const selectedCommandName = i.values[0].replace(/[*:[\] ]/g, "");
                    const command = categories[counter - 1].includes("slash") ? client.slashcommands.get(selectedCommandName) : client.commands.get(selectedCommandName);
                    if (categories[counter - 1].includes("slash")) commandPrefix = "/";

                    if (command) {
                        const fullCommandEmbed = generateFullCommandEmbed(command, commandPrefix);
                        await i.deferReply({ flags: MessageFlags.Ephemeral });
                        await i.followUp({
                            embeds: [fullCommandEmbed],
                        });
                        return;
                    }
                }

                if (i.customId === "next") 
                    counter++;
                else if (i.customId === "previous") 
                    counter--;
                else if (i.customId === "first") 
                    counter = 0;
                else if (i.customId === "last") 
                    counter = categories.length;
                
                if (counter < 0) counter = 0;
                if (counter >= categories.length) counter = categories.length;

                row.components[2].setLabel(`${counter} / ${categories.length}`);

                if (counter == 0) {
                    embed = categoryEmbed;

                    row.components[0].setDisabled(counter == 0);
                    row.components[1].setDisabled(counter == 0);
                    row.components[3].setDisabled(counter == categories.length);
                    row.components[4].setDisabled(counter == categories.length);

                    await i.update({
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

                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId("command_select")
                        .setPlaceholder("Select a command")
                        .addOptions(commandsInCategory.map(command => ({
                            label: command.name.match(/([a-zA-Z0-9]+)/g)[0],
                            description: command.value,
                            value: command.name.match(/([a-zA-Z0-9]+)/g)[0],
                        })));

                    const selectRow = new ActionRowBuilder().addComponents(selectMenu);

                    row.components[0].setDisabled(counter == 0);
                    row.components[1].setDisabled(counter == 0);
                    row.components[3].setDisabled(counter == categories.length);
                    row.components[4].setDisabled(counter == categories.length);

                    await i.update({
                        embeds: [embed],
                        components: [row, selectRow],
                    });
                }
            } catch (error) {
                logger.error(error);
            }
        });

        collector.on("end", async () => {
            row.components.forEach(component => {
                component.setDisabled(true);
            });
            await interaction.editReply({
                embeds: [embed],
                components: [row],
            });
        });
    },
};