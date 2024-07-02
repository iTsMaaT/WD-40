const { version: discordjsVersion } = require("discord.js");
const { dependencies, name } = require("@root/package.json");
const changelogs = require("@root/changelogs.json");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "packages",
    description: "Lists the packages and versions",
    category: "utils",
    private: true,
    async execute(logger, client, message, args, optionalArgs) {
        const WDVersion = changelogs[changelogs.length - 1].version;
    
        const embed = {
            title: "Installed Packages",
            color: 0xffffff,
            description: "The following packages are installed:",
            fields: [],
            timestamp: new Date(),
            footer:{ text: `[Server: ${process.env.SERVER}]` },
        };

        const fields = [];
        fields.push({ name: name.toUpperCase(), value: WDVersion, inline: false });
        fields.push({ name: "discord.js", value: "^" + discordjsVersion, inline: false });
        for (const [packageName, packageVersion] of Object.entries(dependencies)) 
            if (packageName != "discord.js") fields.push({ name: packageName, value: packageVersion, inline: false });
        
        const serverPages = [];

        for (let i = 0; i < fields.length; i += 10) {
            const chunk = fields.slice(i, i + 10);
            serverPages.push(chunk);
        }

        let currentPage = 0;

        // Buttons for pagination
        const firstButton = new ButtonBuilder()
            .setCustomId("first")
            .setLabel("◀◀")
            .setStyle(ButtonStyle.Success);

        const lastButton = new ButtonBuilder()
            .setCustomId("last")
            .setLabel("▶▶")
            .setStyle(ButtonStyle.Success);

        const nextButton = new ButtonBuilder()
            .setCustomId("next")
            .setLabel("▶")
            .setStyle(ButtonStyle.Primary);

        const previousButton = new ButtonBuilder()
            .setCustomId("previous")
            .setLabel("◀")
            .setStyle(ButtonStyle.Primary);

        const pageNumberButton = new ButtonBuilder()
            .setCustomId("page")
            .setLabel(`${currentPage + 1}/${serverPages.length}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);

        const row = new ActionRowBuilder()
            .addComponents(firstButton, previousButton, pageNumberButton, nextButton, lastButton);

        const updatePageNumber = () => {
            row.components[2].setLabel(`${currentPage + 1}/${serverPages.length}`);
        };

        const updateButtons = () => {
            row.components[0].setDisabled(currentPage === 0);
            row.components[1].setDisabled(currentPage === 0);
            row.components[3].setDisabled(currentPage === serverPages.length - 1);
            row.components[4].setDisabled(currentPage === serverPages.length - 1);
        };

        updateButtons();

        embed.fields = serverPages[currentPage];

        const sentMessage = await message.reply({
            embeds: [embed],
            components: [row],
        });

        const collector = sentMessage.createMessageComponentCollector({
            filter: interaction => interaction.user.id === message.author.id,
            time: 120000,
            dispose: true,
        });

        collector.on("collect", async interaction => {
            switch (interaction.customId) {
                case "first":
                    currentPage = 0;
                    break;
                case "previous":
                    currentPage--;
                    break;
                case "next":
                    currentPage++;
                    break;
                case "last":
                    currentPage = serverPages.length - 1;
                    break;
            }

            if (currentPage < 0) currentPage = 0;
            if (currentPage >= serverPages.length) currentPage = serverPages.length - 1;

            updatePageNumber();
            updateButtons();

            embed.fields = serverPages[currentPage];

            await interaction.update({
                embeds: [embed],
                components: [row],
            });
        });
  
        collector.on("end", async () => {
            row.components.forEach(component => {
                component.setDisabled(true);
            });
  
            await sentMessage.edit({
                embeds: [embed],
                components: [row],
            });
        });
    },
};