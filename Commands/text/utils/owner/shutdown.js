const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "shutdown",
    description: "Shuts down the bot from discord",
    category: "utils",
    usage: {
        required: {
            "reason": "reason for shutdown",
        },
    },
    private: true,
    async execute(logger, client, message, args, optionalArgs) {
        const server = process.env.SERVER;

        const YesRestart = new ButtonBuilder()
            .setCustomId("yes")
            .setLabel("Yes")
            .setStyle(ButtonStyle.Success);

        const NoRestart = new ButtonBuilder()
            .setCustomId("no")
            .setLabel("No")
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder()
            .addComponents(YesRestart, NoRestart);

        const embed = {
            color: 0xffff00,
            description: `The bot is currently playing in **${client.voice.adapters.size}** VCs, are you sure you want to shutdown [**${server}**]?`,
            timestamp: new Date(),
        };

        const ConfirmationMessage = await message.reply({
            embeds: [embed],
            components: [row],
        });

        try {
            const interaction = await ConfirmationMessage.awaitMessageComponent({
                filter: (inter) => inter.user.id === message.author.id,
                time: 15000,
            });

            if (interaction.customId === "yes") {
                embed.description = "Shutting down the bot...";
                embed.color = 0xff0000;
                await ConfirmationMessage.edit({ embeds: [embed], components: [row] });

                logger.severe("Shutdown requested from discord");

                setTimeout(() => process.exit(0), 3000);
            } else if (interaction.customId === "no") {
                embed.description = "Shutdown cancelled";
                embed.color = 0xffffff;
                row.components.forEach((component) => component.setDisabled(true));
                await ConfirmationMessage.edit({ embeds: [embed], components: [row] });
            }

            await interaction.update({ components: [row] });
        } catch (error) {
            row.components.forEach((component) => component.setDisabled(true));
            await ConfirmationMessage.edit({ components: [row], embeds: [embed] });
        }
    },
};
