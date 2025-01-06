const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "russianroulette",
    aliases: ["rl"],
    description: "Play a game of Russian Roulette. Spin the chamber and pull the trigger!",
    category: "games",
    async execute(logger, client, message, args, optionalArgs) {

        // Game state
        let chamberPosition = Math.floor(Math.random() * 6); // Random chamber position (0-5)
        let bulletPosition = Math.floor(Math.random() * 6); // Random bullet position (0-5)
        let gameOver = false;

        const getGameDescription = () => gameOver
            ? "**Game Over!** You pulled the trigger and lost."
            : "Spin the chamber or pull the trigger. Will you survive?";

        // Initial game embed
        const gameEmbed = embedGenerator.info({
            title: "Russian Roulette",
            description: getGameDescription(),
            footer: { text: gameOver ? "Game Over" : "Choose your action carefully." },
        });

        // Action buttons
        const spinButton = new ButtonBuilder()
            .setCustomId("spin")
            .setLabel("Spin Chamber")
            .setStyle(ButtonStyle.Primary);

        const triggerButton = new ButtonBuilder()
            .setCustomId("trigger")
            .setLabel("Pull Trigger")
            .setStyle(ButtonStyle.Danger);

        const buttons = new ActionRowBuilder().addComponents(spinButton, triggerButton);

        // Send initial message
        const gameMessage = await message.reply({ embeds: [gameEmbed], components: [buttons] });

        const collector = gameMessage.createMessageComponentCollector({ time: 60000 });

        collector.on("collect", async interaction => {
            if (interaction.user.id !== message.author.id) 
                return interaction.reply({ content: "This game isn't for you!", ephemeral: true });
            

            if (gameOver) 
                return interaction.reply({ content: "The game is over! Start a new game to play again.", ephemeral: true });
            

            if (interaction.customId === "spin") {
                // Spin the chamber: randomize bullet position
                bulletPosition = Math.floor(Math.random() * 6);
                gameEmbed.setDescription("You spun the chamber. The bullet's position is unknown.\n\nPull the trigger if you dare!");
                await interaction.update({ embeds: [gameEmbed] });
            } else if (interaction.customId === "trigger") {
                // Pull the trigger: check if the bullet is in the chamber
                if (chamberPosition === bulletPosition) {
                    gameOver = true;
                    gameEmbed.setDescription("**Bang!** You've been hit. Game over.");
                    gameEmbed.setFooter({ text: "Better luck next time!" });
                    await gameMessage.edit({ embeds: [gameEmbed], components: [] });
                    collector.stop();
                } else {
                    gameEmbed.setDescription("**Click!** You're safe... for now.\n\nSpin or pull again?");
                    await interaction.update({ embeds: [gameEmbed] });

                    // Move to the next chamber
                    chamberPosition = (chamberPosition + 1) % 6;
                }
            }
        });

        collector.on("end", async () => {
            if (!gameOver && gameMessage.editable) {
                gameEmbed.setFooter({ text: "Game timed out." });
                await gameMessage.edit({ components: [] });
            }
        });
    },
};
