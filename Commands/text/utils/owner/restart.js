const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");

module.exports = {
    name: "restart",
    description: "Restart the bot from discord",
    category: "utils",
    private: true,
    async execute(logger, client, message, args, optionalArgs) {
        const server = process.env.SERVER;

        if (message.author.id == process.env.OWNER_ID) {
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
                description: `The bot is currently playing in **${client.voice.adapters.size}** VCs, are you sure you want to restart [**${server}**]?`,
                timestamp: new Date(),
            };
          
            const ConfirmationMessage = await message.reply({
                embeds: [embed],
                components: [row],
            });
          
            const filter = (interaction) => {
                return interaction.user.id === message.author.id;
            };
          
            const collector = ConfirmationMessage.createMessageComponentCollector({
                filter,
                time: 15000, // The time in milliseconds to wait for a response (15 seconds in this example).
                max: 1, // The maximum number of interactions to collect.
            });
          
            collector.on("collect", (interaction) => {
                if (interaction.customId === "yes") {
                    embed.description = "Restarting the bot...";
                    embed.color = 0xff0000;
                    ConfirmationMessage.edit({ embeds: [embed], components: [row] }).then(() => {
                            
                        logger.severe("Restart requested from discord");
                        client.channels.cache.get("1037141235451842701").send(`Restart requested from discord for reason : \`${args?.join(" ") || "No reasons provided."}\``);

                        // After 3s, closes the database and then exits the process
                        setTimeout(function() {
                            /** **************/
                            process.exit(1);
                            /** **************/
                        }, 1000 * 3);
                        return;
            
                    });
                } else if (interaction.customId === "no") {
                    embed.description = "Restart cancelled";
                    embed.color = 0xffffff;
                    ConfirmationMessage.edit({ embeds: [embed], components: [row] }).then(() => {
                        row.components.forEach((component) => component.setDisabled(true));
                        ConfirmationMessage.edit({ components: [row] });
                    });
                }
                
                interaction.update({
                    components: [row],
                });
            });
          
            collector.on("end", async () => {
                row.components.forEach((component) => component.setDisabled(true));
                await ConfirmationMessage.edit({ components: [row], embeds: [embed] });
            });
        }
    },
};