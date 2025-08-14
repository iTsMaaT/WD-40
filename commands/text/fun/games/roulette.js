const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "roulette",
    description: "Play a game of Casino Roulette! Bet on a number (0-36) or color (Red or Black).",
    category: "games",
    async execute(logger, client, message, args, flags) {

        const rouletteNumbers = [
            { number: 0, color: "Green" },
            { number: 1, color: "Red" }, { number: 2, color: "Black" }, { number: 3, color: "Red" },
            { number: 4, color: "Black" }, { number: 5, color: "Red" }, { number: 6, color: "Black" },
            { number: 7, color: "Red" }, { number: 8, color: "Black" }, { number: 9, color: "Red" },
            { number: 10, color: "Black" }, { number: 11, color: "Black" }, { number: 12, color: "Red" },
            { number: 13, color: "Black" }, { number: 14, color: "Red" }, { number: 15, color: "Black" },
            { number: 16, color: "Red" }, { number: 17, color: "Black" }, { number: 18, color: "Red" },
            { number: 19, color: "Red" }, { number: 20, color: "Black" }, { number: 21, color: "Red" },
            { number: 22, color: "Black" }, { number: 23, color: "Red" }, { number: 24, color: "Black" },
            { number: 25, color: "Red" }, { number: 26, color: "Black" }, { number: 27, color: "Red" },
            { number: 28, color: "Black" }, { number: 29, color: "Black" }, { number: 30, color: "Red" },
            { number: 31, color: "Black" }, { number: 32, color: "Red" }, { number: 33, color: "Black" },
            { number: 34, color: "Red" }, { number: 35, color: "Black" }, { number: 36, color: "Red" },
        ];

        const initialEmbed = embedGenerator.info({
            title: "Casino Roulette",
            description: "Place your bet!\nChoose a **number (0-36)** or **color (Red or Black)**.",
            footer: { text: "Click a button to place your bet." },
        });

        const betButtons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("bet_red")
                    .setLabel("Bet on Red")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("bet_black")
                    .setLabel("Bet on Black")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("bet_number")
                    .setLabel("Bet on Number")
                    .setStyle(ButtonStyle.Secondary),
            );

        const initialMessage = await message.reply({ embeds: [initialEmbed], components: [betButtons] });

        const collector = initialMessage.createMessageComponentCollector({ time: 60000 });

        let userBet = null;

        collector.on("collect", async interaction => {
            if (interaction.user.id !== message.author.id) 
                return interaction.reply({ content: "This game isn't for you!", flags: MessageFlags.Ephemeral });
            

            if (interaction.customId === "bet_red") {
                userBet = { type: "color", value: "Red" };
                await interaction.update({ content: "You bet on Red!", components: [] });
                collector.stop();
            } else if (interaction.customId === "bet_black") {
                userBet = { type: "color", value: "Black" };
                await interaction.update({ content: "You bet on Black!", components: [] });
                collector.stop();
            } else if (interaction.customId === "bet_number") {
                await interaction.deferUpdate();
                await interaction.followUp({ content: "Please type a number between 0 and 36 as your bet.", flags: MessageFlags.Ephemeral });

                const filter = msg => msg.author.id === interaction.user.id && !isNaN(msg.content) && Number(msg.content) >= 0 && Number(msg.content) <= 36;

                await message.channel.awaitMessages({ filter, max: 1, time: 60000, errors: ["time"] })
                    .then(collected => {
                        const responseMessage = collected.first();
                        userBet = { type: "number", value: parseInt(responseMessage.content) };
                        responseMessage.delete().catch(() => null);
                        collector.stop();
                    })
                    .catch(() => {
                        interaction.followUp({ content: "Time's up! You didn't pick a valid number.", flags: MessageFlags.Ephemeral });
                    });
            }
        });

        collector.on("end", async () => {
            if (!userBet && initialMessage.editable) {
                const timeoutEmbed = embedGenerator.info({
                    title: "Casino Roulette",
                    description: "You took too long to place a bet. The game has ended.",
                });
                await initialMessage.edit({ embeds: [timeoutEmbed], components: [] });
                return;
            }

            const result = rouletteNumbers[Math.floor(Math.random() * rouletteNumbers.length)];
            const win = (userBet.type === "color" && userBet.value === result.color) ||
                        (userBet.type === "number" && userBet.value === result.number);

            const resultEmbed = embedGenerator.info({
                title: "Roulette Spin Result",
                description: `The roulette landed on **${result.number} ${result.color}**!\n\n${win ? "🎉 You won!" : "💀 You lost!"}`,
                footer: { text: "Thanks for playing!" },
            });

            await initialMessage.edit({ embeds: [resultEmbed], components: [] });
        });
    },
};
