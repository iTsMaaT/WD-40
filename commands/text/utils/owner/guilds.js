const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "guilds",
    category: "owner",
    description: "Makes a list of the guilds the bot is in",
    private: true,
    async execute(logger, client, message, args, flags) {

        // Collect all guilds across all shards
        const allGuildsArrays = await client.shard.broadcastEval(c => {
            return c.guilds.cache.map(guild => ({
                id: guild.id,
                name: guild.name,
                memberCount: guild.memberCount,
                joinedTimestamp: guild.members.me?.joinedTimestamp ?? Date.now(),
                botCount: guild.members.cache.filter(m => m.user.bot).size,
                userCount: guild.memberCount - guild.members.cache.filter(m => m.user.bot).size,
            }));
        });

        // Flatten arrays into one
        const guilds = allGuildsArrays.flat().sort((a, b) => b.joinedTimestamp - a.joinedTimestamp);

        const guildCount = guilds.length;
        let totalUsers = 0;
        let totalBots = 0;
        const serverPages = [];
        const fields = [];

        // Pre-calculate counts for padding
        const userCountArray = guilds.map(g => g.userCount);
        const botCountArray = guilds.map(g => g.botCount);

        // Add fields for each guild
        guilds.forEach(guild => {
            const { userCount, botCount, memberCount } = guild;

            const userPadding = " ".repeat(Math.max(0, Math.max(...userCountArray).toString().length - userCount.toString().length));
            const botPadding = " ".repeat(Math.max(0, Math.max(...botCountArray).toString().length - botCount.toString().length));

            totalUsers += userCount;
            totalBots += botCount;

            fields.push({
                name: `${guild.name} (${guild.id})`,
                value: `\`Users: ${userCount}${userPadding} | Bots: ${botCount}${botPadding} | Total: ${memberCount}\``,
            });
        });

        // Create the embed
        const embed = {
            title: "Guilds List",
            color: 0xffffff,
            description: `Total Guilds: ${guildCount} | Users: ${totalUsers} | Bots: ${totalBots} | Total: ${totalUsers + totalBots}`,
            fields: [],
        };

        // Split into pages of 10
        for (let i = 0; i < fields.length; i += 10) 
            serverPages.push(fields.slice(i, i + 10));

        let currentPage = 0;

        // Buttons for pagination
        const firstButton = new ButtonBuilder().setCustomId("first").setLabel("◀◀").setStyle(ButtonStyle.Success);
        const lastButton = new ButtonBuilder().setCustomId("last").setLabel("▶▶").setStyle(ButtonStyle.Success);
        const nextButton = new ButtonBuilder().setCustomId("next").setLabel("▶").setStyle(ButtonStyle.Primary);
        const previousButton = new ButtonBuilder().setCustomId("previous").setLabel("◀").setStyle(ButtonStyle.Primary);
        const pageNumberButton = new ButtonBuilder()
            .setCustomId("page")
            .setLabel(`${currentPage + 1}/${serverPages.length}`)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(true);

        const row = new ActionRowBuilder().addComponents(firstButton, previousButton, pageNumberButton, nextButton, lastButton);

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

        const sentMessage = await message.reply({ embeds: [embed], components: [row] });

        const collector = sentMessage.createMessageComponentCollector({
            filter: interaction => interaction.user.id === message.author.id,
            idle: 120000,
            dispose: true,
        });

        collector.on("collect", async interaction => {
            switch (interaction.customId) {
                case "first": currentPage = 0; break;
                case "previous": currentPage--; break;
                case "next": currentPage++; break;
                case "last": currentPage = serverPages.length - 1; break;
            }

            if (currentPage < 0) currentPage = 0;
            if (currentPage >= serverPages.length) currentPage = serverPages.length - 1;

            updatePageNumber();
            updateButtons();

            embed.fields = serverPages[currentPage];

            await interaction.update({ embeds: [embed], components: [row] });
        });

        collector.on("end", async () => {
            row.components.forEach(component => component.setDisabled(true));
            await sentMessage.edit({ embeds: [embed], components: [row] });
        });
    },
};
