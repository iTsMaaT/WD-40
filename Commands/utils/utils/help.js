const { ActionRowBuilder, ButtonBuilder, ButtonStyle, Component } = require("discord.js")
module.exports = {
    name: "help",
    description: "Lists commands",
    category: "utils",
    private: true,
    async execute(logger, client, message, args) {
        //Finds all command files and separate them from categories, then use page to list the commands per category, -admin shows the private ones (admin or iTsMaaT only)

        let counter = 0;
        //let helpmessagebuilder = "";
        let prefix = global.GuildManager.GetPrefix(message.guild);
        //helpmessagebuilder += `**The prefix is:** \`${prefix}\`\n\n`
        let categorymapper = {};
        client.commands.each((val) => {
            if (!val.private) {
                if (categorymapper[val.category]) {
                    categorymapper[val.category] += (`**${val.name}: **` + val.description.charAt(0).toUpperCase() + val.description.slice(1)) + "\r\n";
                } else {
                    categorymapper[val.category] = (`**${val.name}: **` + val.description.charAt(0).toUpperCase() + val.description.slice(1)) + "\r\n";
                }
            }
        })
        let categories = Object.keys(categorymapper);

        //console.log(require('discord.js').version)

        const FisrtPage = new ButtonBuilder()
            .setCustomId('first')
            .setLabel('◀◀')
            .setStyle(ButtonStyle.Success)
            
        const LastPage = new ButtonBuilder()
            .setCustomId('last')
            .setLabel('▶▶')
            .setStyle(ButtonStyle.Success)

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

        var CategoriesPage = `__Command categories__ (\`>help <page number>\` to see the commands)\n**The prefix is: **\`${prefix}\`\n`;
        for (let i = 0; i < categories.length; i++) {
            CategoriesPage += `**Page ${i + 1}** : ${categories[i].toUpperCase()}\n`;
        }

        row.components[0].setDisabled(true);
        row.components[1].setDisabled(true);
        var HelpFull = await message.reply({
            content: CategoriesPage,
            components: [row],
            allowedMentions: { repliedUser: false }
        });

        const filter = (interaction) => {
            if (interaction.user.id == message.author.id) return true;
        }

        const collector = HelpFull.createMessageComponentCollector({
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
                // If we're on the first page, show the categories page
                await HelpFull.edit({
                    content: CategoriesPage,
                    components: [row],
                    allowedMentions: { repliedUser: false }
                });
            } else {
                // Otherwise, show the commands for the current category
                let HelpFullPage = `__Commands for category : **${categories[counter - 1].toUpperCase()}**__\n`;
                HelpFullPage += categorymapper[categories[counter - 1]];
                await HelpFull.edit({
                    content: HelpFullPage,
                    components: [row],
                    allowedMentions: { repliedUser: false }
                })
            }

            // Update the button states based on the current page number
            await row.components[0].setDisabled(counter == 0);
            await row.components[1].setDisabled(counter == 0);
            await row.components[3].setDisabled(counter == categories.length);
            await row.components[4].setDisabled(counter == categories.length);

            await interaction.update({
                components: [row],
            });
        });

        collector.on("end", async (interaction) => {
            const messageContent = `${HelpFull.content}\n[\`Buttons expired.\`]`;
            row.components.forEach(component => {
                component.setDisabled(true);
            })
            await HelpFull.edit({
                content: messageContent,
                components: [row],
                allowedMentions: { repliedUser: false }
            });
        });
    }
}