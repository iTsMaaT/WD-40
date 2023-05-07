const USERID = require("../../../UserIDs.js");
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
            .addComponents(PreviousPage, PageNumber, NextPage);

        var CategoriesPage = `__Command categories__ (\`>help <page number>\` to see the commands)\n**The prefix is: **\`${prefix}\`\n`;
        for (let i = 0; i < categories.length; i++) {
            CategoriesPage += `**Page ${i + 1}** : ${categories[i].toUpperCase()}\n`;
        }

        row.components[0].setDisabled(true);
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
            if (counter < 0) counter = 0;
            if (counter >= categories.length - 1) counter = categories.length - 1;

            if (interaction.customId === 'next') {
                counter++;
            } else if (interaction.customId === 'previous') {
                counter--;
            }
            row.components[1].setLabel(`${counter} / ${categories.length}`)

            if (counter == 0) {
                HelpFull.edit({
                    content: CategoriesPage,
                    components: [row],
                    allowedMentions: { repliedUser: false }
                });
            } else {
                let HelpFullPage = `__Commands for category : **${categories[counter - 1].toUpperCase()}**__\n`;
                HelpFullPage += categorymapper[categories[counter - 1]];
                HelpFull.edit({
                    content: HelpFullPage,
                    components: [row],
                    allowedMentions: { repliedUser: false }
                })
            }

            if (counter == 0) { await row.components[0].setDisabled(true) } else { await row.components[0].setDisabled(false) }
            if (counter == categories.length) { await row.components[2].setDisabled(true) } else { await row.components[2].setDisabled(false) }
            await interaction.update({
                components: [row],
            })
        })

        collector.on("end", async (interaction) => {
            const messageContent = `${HelpFull.content}\n[\`Buttons expired.\`]`;
            row.components.forEach(component => {
                component.setDisabled(true);
            })
            HelpFull.edit({
                content: messageContent,
                components: [row],
                allowedMentions: { repliedUser: false }
            })
        })
    }
}