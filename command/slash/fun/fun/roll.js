const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "roll",
    description: "Roll between 1 and 250 dices of up to 250 sides. Defaults to rolling 1d6.",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "amount",
            description: "Amount of dices to roll",
            type: ApplicationCommandOptionType.Integer,
            required: false,
        },
        {
            name: "sides",
            description: "Amount of sides per dice",
            type: ApplicationCommandOptionType.Integer,
            required: false,
        },
    ],
    execute(logger, interaction, client) {
        // Parse the number of dices and the number of sides per dice
        const numDices = interaction.options.get("amount")?.value ?? 1;
        const numSides = interaction.options.get("sides")?.value ?? 6;

        if (isNaN(numDices) || isNaN(numSides) || numDices < 1 || numSides < 2) 
            return interaction.editReply({ embeds: [embedGenerator.warning("The amount of dices or sides per dices is invalid, please use at least a 1d2 (1 dice with 2 sides)")] });
            

        // Limits the input to 50d50
        if (numDices > 50 || numSides > 50) 
            return interaction.editReplyeply({ embeds: [embedGenerator.warning("Maximum of 50 dices with 50 sides")] });
            

        // Roll the dices
        const rolls = Array.from({ length: numDices }, () => Math.floor(Math.random() * numSides) + 1);
        const total = rolls.reduce((acc, cur) => acc + cur, 0);

        RollEmbed = {
            color: 0xffffff,
            title: `Rolling **${numDices}d${numSides}**...`,
            fields: [
                { name: "Rolls", value: rolls.join(", ") },
                { name: "Total", value: total, inline: true },
                { name: "Maximum possible", value: numDices * numSides, inline: true },
            ],
            timestamp: new Date(),
        };

        interaction.editReply({ embeds: [RollEmbed] });
    },
};