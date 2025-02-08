const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "rps",
    description: "Play Rock, Paper, Scissors against the bot!",
    category: "games",
    async execute(logger, client, message, args, optionalArgs) {

        // Options for Rock, Paper, Scissors
        const options = ["Rock", "Paper", "Scissors"];
        
        // Create an embed to prompt the player to make a choice
        const initialEmbed = embedGenerator.info({
            title: "Rock, Paper, Scissors",
            description: "Choose **Rock**, **Paper**, or **Scissors**!",
            footer: { text: "Click a button to make your choice." },
        });

        // Action row with buttons for Rock, Paper, and Scissors
        const rpsButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("rps_rock")
                    .setLabel("Rock")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("rps_paper")
                    .setLabel("Paper")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("rps_scissors")
                    .setLabel("Scissors")
                    .setStyle(ButtonStyle.Primary),
            );

        const initialMessage = await message.reply({ embeds: [initialEmbed], components: [rpsButtons] });

        // Collector to handle button clicks
        const collector = initialMessage.createMessageComponentCollector({ time: 15000 });

        collector.on("collect", async interaction => {
            if (interaction.user.id !== message.author.id) 
                return interaction.reply({ content: "This game isn't for you!", flags: MessageFlags.Ephemeral });
            
            // Get the player's choice from the button they clicked
            let playerChoice;
            if (interaction.customId === "rps_rock") 
                playerChoice = "Rock";
            else if (interaction.customId === "rps_paper") 
                playerChoice = "Paper";
            else if (interaction.customId === "rps_scissors") 
                playerChoice = "Scissors";
            

            // Bot's random choice
            const botChoice = options[Math.floor(Math.random() * options.length)];
            
            // Determine the result
            let result;
            if (playerChoice === botChoice) 
                result = "It's a tie!";
            else if (
                (playerChoice === "Rock" && botChoice === "Scissors") ||
                (playerChoice === "Paper" && botChoice === "Rock") ||
                (playerChoice === "Scissors" && botChoice === "Paper")
            ) 
                result = "🎉 You won!";
            else 
                result = "💀 You lost!";
            

            // Result embed
            const resultEmbed = embedGenerator.info({
                title: "Rock, Paper, Scissors - Result",
                description: `You chose **${playerChoice}**.\nThe bot chose **${botChoice}**.\n\n${result}`,
                footer: { text: "Thanks for playing!" },
            });

            // Update message with the result
            await interaction.update({ embeds: [resultEmbed], components: [] });
            collector.stop(); // Stop the collector to prevent the timeout message
        });

        collector.on("end", async (collected, reason) => {
            // Only send a timeout message if the collector ended due to time running out
            if (reason === "time" && initialMessage.editable) {
                const timeoutEmbed = embedGenerator.info({
                    title: "Rock, Paper, Scissors",
                    description: "You took too long to make a choice. The game has ended.",
                });
                await initialMessage.edit({ embeds: [timeoutEmbed], components: [] });
            }
        });
    },
};