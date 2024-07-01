const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "guilds",
    category: "utils",
    description: "Makes a list of the guilds the bot is in",
    private: true,
    async execute(logger, client, message, args, found) {
        
        const guilds = client.guilds.cache;
        const guildCount = guilds.size;
        let totalUsers = 0;
        let totalBots = 0;
        const serverPages = [];
        const fields = [];
  
        // Create the embed
        const embed = {
            title: "Guilds List",
            color: 0xffffff,
            description: "",
            fields: [],
            footer: {
                text: "",
            },
        };
        const userCountArray = [];
        const botCountArray = [];
        guilds.forEach(guild => {
            userCountArray.push(parseInt(guild.members.cache.filter(member => !member.user.bot).size));
            botCountArray.push(parseInt(guild.members.cache.filter(member => member.user.bot).size));
        }); 

        // Add fields for each guild
        guilds.forEach(guild => {
            const botCount = guild.members.cache.filter(member => member.user.bot).size;
            const userCount = guild.memberCount - botCount;
            const totalCount = guild.memberCount;

            const userPadding = " ".repeat(Math.max(...userCountArray).toString().length - userCount.toString().length);
            const botPadding = " ".repeat(Math.max(...botCountArray).toString().length - botCount.toString().length);
  
            totalUsers += userCount;
            totalBots += botCount;
  
            const field = {
                name: `${guild.name} (${guild.id})`,
                value: `\`Users: ${userCount}${userPadding} | Bots: ${botCount}${botPadding} | Total: ${totalCount}\``,
            };
  
            fields.push(field);
        });
  
        // Set the footer text
        embed.description = `Total Guilds: ${guildCount} | Users: ${totalUsers} | Bots: ${totalBots} | Total: ${totalUsers + totalBots}`;
  
        // Send the embed
        message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });


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