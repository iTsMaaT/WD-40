const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ApplicationCommandOptionType } = require("discord.js");
const { prettyString } = require("@functions/formattingFunctions");
const { SendErrorEmbed } = require("@functions/discordFunctions");
const GuildManager = require("@root/utils/GuildManager.js");

module.exports = {
    name: "help",
    description: "Lists commands",
    options: [
        {
            name: "command",
            type: ApplicationCommandOptionType.String,
            description: "Get help for a specific command",
            required: false,
        },
    ],
    async execute(logger, interaction, client) {
        const command = interaction.options.get("command")?.value;
        const prefix = GuildManager.GetPrefix(interaction.guild);

        if (command) {
            const CommandName = client.commands.get(command);
            if (!CommandName || CommandName.private) return SendErrorEmbed(interaction, "This command doesn't exist.", "red");

            const CommandEmbed = {
                title: `**${prefix}${CommandName.name}**`,
                color: 0xffffff,
                fields: [{ name: "Description", value: CommandName.description }],
                timestamp: new Date(),
            };

            if (typeof CommandName.usage === "string") {
                CommandEmbed.fields.push({ name: "Options", value: CommandName.description });
            } else if (typeof CommandName.usage === "object") {
                let requiredString = "";
                let optionalString = "";
                let usageString = "";
                if (Object.keys(CommandName.usage.required ?? {}).length) 
                    requiredString += `__Required__:\n${Object.keys(CommandName.usage.required).map(key => `${key.toLowerCase()}: ${prettyString(CommandName.usage.required[key], "first", false)}`).join("\n")}`;
                if (Object.keys(CommandName.usage.optional ?? {}).length) 
                    optionalString += `__Optional__:\n${Object.keys(CommandName.usage.optional).map(key => `-${key.split("|")[0].toLowerCase()}${key.split("|").slice(1).length > 0 ? `[${key.split("|").slice(1).join(",").toLowerCase()}]` : ""}${(CommandName.usage.optional[key].hasValue ?? false) ? " <value>" : ""}: ${prettyString(CommandName.usage.optional[key].description, "first", false)}`).join("\n")}`;
                usageString = `${requiredString}${requiredString.length > 0 && optionalString.length > 0 ? "\n" : ""}${optionalString}`;
                CommandEmbed.fields.push({ name: "Options", value: usageString });
                CommandEmbed.footer = { text: "Optional options explanation: -parameterName[parameterAliases]: parameterDescription" };
            }

            if (CommandName.aliases) CommandEmbed.fields.push({ name: "Aliases", value: CommandName.aliases.join(", ") });
            if (CommandName.examples) {
                const formattedExamples = [];
                CommandName.examples.forEach(ex => {formattedExamples.push(`${prefix}${CommandName.name} ${ex}`);});
                CommandEmbed.fields.push({ name: "Examples", value: formattedExamples.join("\n") });
            }
            if (CommandName.cooldown) CommandEmbed.fields.push({ name: "Cooldown", value: parseInt(CommandName.cooldown) / 1000 + "s" });

            return interaction.reply({ embeds: [CommandEmbed]  });
        }
        // Finds all command files and separate them from categories, then use page to list the commands per category

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
            description: `**The prefix is:** \`${prefix}\`\nSupport server: https://discord.gg/pqKE2QZrFM\n\nTotal commands: ${addedCommands.size}\n${pages.join("\n")}`,
            color: 0xffffff,
            footer: { text: "Buttons expire after 2 minutes." },
        };
              

        row.components[0].setDisabled(true);
        row.components[1].setDisabled(true);
        const helpMessage = await interaction.reply({
            embeds: [categoryEmbed],
            components: [row],
            allowedMentions: { repliedUser: false },
        });


        const filter = (interac) => {
            if (interac.user.id == interac.user.id) return true;
        };

        const collector = helpMessage.createMessageComponentCollector({
            filter,
            time: 120000,
            dispose: true,
        });
        
        let embed = categoryEmbed;
        collector.on("collect", async (interac) => {

            if (interac.customId === "next") 
                counter++;
            else if (interac.customId === "previous") 
                counter--;
            else if (interac.customId === "first") 
                counter = 0;
            else if (interac.customId === "last") 
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

            } else {
                const currentCategory = categories[counter - 1];
                embed = {
                    title: `Commands for category: ${currentCategory.toUpperCase().replace(" (1)", "")}`,
                    fields: groupedObject[currentCategory],
                    color: 0xffffff, // Embed color (you can change it to any color you like)
                };

                await row.components[0].setDisabled(counter == 0);
                await row.components[1].setDisabled(counter == 0);
                await row.components[3].setDisabled(counter == categories.length);
                await row.components[4].setDisabled(counter == categories.length);
            }

            helpMessage.edit({
                embeds: [embed],
                components: [row],
                allowedMentions: { repliedUser: false },
            });

            await interac.update({
                embeds: [embed],
                components: [row],
            });
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