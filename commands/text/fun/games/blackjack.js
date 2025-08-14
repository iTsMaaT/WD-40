const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "blackjack",
    description: "Play a game of Blackjack.",
    aliases: ["bj"],
    category: "games",
    async execute(logger, client, message, args, flags) {

        // Create and shuffle the deck
        const suits = ["`♠️`", "♥️", "♦️", "`♣️`"];
        const values = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
        const deck = [...suits.flatMap(suit => values.map(value => ({ value, suit })))].sort(() => Math.random() - 0.5);

        const playerHand = [deck.pop(), deck.pop()];
        const dealerHand = [deck.pop(), deck.pop()];
        let playerTurn = true;

        function calculateHandValue(hand) {
            let value = 0;
            let aces = 0;
            for (const card of hand) {
                if (card.value === "A") {
                    aces++;
                    value += 11;
                } else if (["K", "Q", "J"].includes(card.value)) {
                    value += 10;
                } else {
                    value += parseInt(card.value);
                }
            }
            while (value > 21 && aces > 0) {
                value -= 10;
                aces--;
            }
            return value;
        }

        const getHandsDescription = () => {
            return `
                **Your Hand**: ${playerHand.map(card => `${card.value}${card.suit}`).join(", ")} (Value: ${calculateHandValue(playerHand)})\n` +
                `**Dealer's Hand**: ${dealerHand[0].value}${dealerHand[0].suit}, ???`;
        };

        const gameEmbed = embedGenerator.info({
            title: "Blackjack",
            description: getHandsDescription(),
            footer: { text: "Use the buttons below to hit or stand." },
        });

        // Button row for "Hit" and "Stand"
        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId("hit")
                    .setLabel("Hit")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId("stand")
                    .setLabel("Stand")
                    .setStyle(ButtonStyle.Danger),
            );

        const gameMessage = await message.reply({ embeds: [gameEmbed], components: [buttons] });

        const collector = gameMessage.createMessageComponentCollector({ time: 60000 });

        collector.on("collect", async interaction => {
            if (interaction.user.id !== message.author.id) 
                return interaction.reply({ content: "This game isn't for you!", flags: MessageFlags.Ephemeral });
            

            if (interaction.customId === "hit" && playerTurn) {
                playerHand.push(deck.pop());
                if (calculateHandValue(playerHand) > 21) {
                    playerTurn = false;
                    gameEmbed.setDescription(`${getHandsDescription()}\n\n**You bust! Dealer wins.**`);
                    gameEmbed.setFooter(null);
                    await gameMessage.edit({ embeds: [gameEmbed], components: [] });
                    collector.stop();
                } else {
                    gameEmbed.setDescription(getHandsDescription());
                    await interaction.update({ embeds: [gameEmbed] });
                }
            } else if (interaction.customId === "stand" && playerTurn) {
                playerTurn = false;

                while (calculateHandValue(dealerHand) < 17) 
                    dealerHand.push(deck.pop());
                

                const playerScore = calculateHandValue(playerHand);
                const dealerScore = calculateHandValue(dealerHand);

                let result;
                if (dealerScore > 21 || playerScore > dealerScore) 
                    result = "You win!";
                else if (dealerScore > playerScore) 
                    result = "Dealer wins!";
                else 
                    result = "It's a tie!";
                

                gameEmbed.setDescription(
                    `**Your Hand**: ${playerHand.map(card => `${card.value}${card.suit}`).join(", ")} (Value: ${playerScore})\n` +
                    `**Dealer's Hand**: ${dealerHand.map(card => `${card.value}${card.suit}`).join(", ")} (Value: ${dealerScore})`,
                );
                gameEmbed.setFooter(null);
                gameEmbed.addFields({ name: "Result", value: result });
                await gameMessage.edit({ embeds: [gameEmbed], components: [] });
                collector.stop();
            }
        });

        collector.on("end", async () => {
            if (gameMessage.editable) 
                await gameMessage.edit({ components: [] });
        });
    },
};
