const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const prettyString = require("../../../../utils/functions/prettyString.js");
const SendErrorEmbed = require("../../../../utils/functions/SendErrorEmbed.js");
module.exports = {
    name: "help",
    description: "Lists commands",
    category: "utils",
    private: true,
    async execute(logger, client, message, args) {
        //Finds all command files and separate them from categories, then use page to list the commands per category

        let counter = 0;
        const prefix = global.GuildManager.GetPrefix(message.guild);
        const categorymapper = {};
        const addedCommands = new Set(); // Keep track of added commands

        if (args[0] == "-u") {
            client.commands.each((val) => {
                if (!val.private && !addedCommands.has(val.name)) {
                    if (categorymapper[val.category]) {
                        categorymapper[val.category] += (`**${val.name}: **` + prettyString(val.usage ?? "-", "first")) + "\r\n";
                    } else {
                        categorymapper[val.category] = (`**${val.name}: **` + prettyString(val.usage ?? "-", "first")) + "\r\n";
                    }
                    addedCommands.add(val.name);
                }
            });
        } else if (!args[0]) {
            client.commands.each((val) => {
                if (!val.private && !addedCommands.has(val.name)) {
                    if (categorymapper[val.category]) {
                        categorymapper[val.category] += (`**${val.name}${val.aliases ? ` [${(val.aliases).join("")}]` : ""}: **` + prettyString(val.description, "first", true)) + "\r\n";
                    } else {
                        categorymapper[val.category] = (`**${val.name}: **` + prettyString(val.description, "first", true)) + "\r\n";
                    }
                    addedCommands.add(val.name);
                }
            });
        } else if (args[0]) {
            const CommandName = client.commands.get(args[0]);
            if (!CommandName) SendErrorEmbed(message, "This command doesn't exist.", "red");
            if (!CommandName.private) {
                var CommandEmbed = {
                    title: `**${CommandName.name}** ${CommandName.usage ?? ""}`,
                    color: 0xffffff,
                    description: CommandName.description,
                    timestamp: new Date(),
                };
                return message.reply({ embeds: [CommandEmbed], allowedMentions: { repliedUser: false } });
            }
        }

        const categories = Object.keys(categorymapper);

        //console.log(require('discord.js').version)

        const FisrtPage = new ButtonBuilder()
            .setCustomId('first')
            .setLabel('◀◀')
            .setStyle(ButtonStyle.Success);

        const LastPage = new ButtonBuilder()
            .setCustomId('last')
            .setLabel('▶▶')
            .setStyle(ButtonStyle.Success);

        const NextPage = new ButtonBuilder()
            .setCustomId('next')
            .setLabel('▶')
            .setStyle(ButtonStyle.Primary);

        const PreviousPage = new ButtonBuilder()
            .setCustomId('previous')
            .setLabel('◀')
            .setStyle(ButtonStyle.Primary);

        const PageNumber = new ButtonBuilder()
            .setCustomId('page')
            .setLabel(`${counter} / ${categories.length}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);

        const row = new ActionRowBuilder()
            .addComponents(FisrtPage, PreviousPage, PageNumber, NextPage, LastPage);

        var embed = {
            title: "Command categories",
            description: `**The prefix is:** \`${prefix}\`\n\nTotal commands: ${addedCommands.size}\n${categories
                .map((category, index) => `**Page ${index + 1}:** ${category.toUpperCase()}`)
                .join("\n")}`,
            color: 0xffffff, // Embed color (you can change it to any color you like)
            footer: { text: `Buttons expire after 2 minutes.` }
        };

        row.components[0].setDisabled(true);
        row.components[1].setDisabled(true);
        const helpMessage = await message.reply({
            embeds: [embed],
            components: [row],
            allowedMentions: { repliedUser: false },
        });


        const filter = (interaction) => {
            if (interaction.user.id == message.author.id) return true;
        };

        const collector = helpMessage.createMessageComponentCollector({
            filter,
            time: 120000,
            dispose: true
        });

        collector.on("collect", async (interaction) => {

            if (interaction.customId === 'next') {
                counter++;
            } else if (interaction.customId === 'previous') {
                counter--;
            } else if (interaction.customId === 'first') {
                counter = 0;
            } else if (interaction.customId === 'last') {
                counter = categories.length;
            }
            if (counter < 0) counter = 0;
            if (counter >= categories.length) counter = categories.length;

            // Update the label to show the current page number
            row.components[2].setLabel(`${counter} / ${categories.length}`);

            if (counter == 0) {
                embed = {
                    title: "Command categories",
                    description: `**The prefix is:** \`${prefix}\`\n\nTotal commands: ${addedCommands.size}\n${categories
                        .map((category, index) => `**Page ${index + 1}:** ${category.toUpperCase()}`)
                        .join("\n")}`,
                    color: 0xffffff, // Embed color (you can change it to any color you like)
                    footer: { text: `Buttons expire after 2 minutes.` }
                };

                await row.components[0].setDisabled(counter == 0);
                await row.components[1].setDisabled(counter == 0);
                await row.components[3].setDisabled(counter == categories.length);
                await row.components[4].setDisabled(counter == categories.length);

            } else {
                const currentCategory = categories[counter - 1];
                embed = {
                    title: `Commands for category: ${currentCategory.toUpperCase()}`,
                    description: categorymapper[categories[counter - 1]],
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

            await interaction.update({
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
                allowedMentions: { repliedUser: false }
            });
        });
    }
};