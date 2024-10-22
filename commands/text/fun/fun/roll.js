const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "roll",
    description: "Roll between 1 and 50 dices of up to 50 sides. Defaults to rolling 1d6 when no arguments are given.",
    usage: {
        required: {
            "roll": "the dice to roll, like 1d6 (<dice amount>d<dice sides>)",
        },
    },
    category: "fun",
    examples: ["2d20"],
    execute(logger, client, message, args, optionalArgs) {
        // Check if arguments are provided
        if (args.length > 0) {
            // Parse the number of dices and the number of sides per dice
            const [numDices, numSides] = args[0].split("d").map(str => parseInt(str));

            // Check if the input is valid
            if (isNaN(numDices) || isNaN(numSides) || numDices < 1 || numSides < 2) 
                return message.reply("The amount of dices or sides per dices is invalid, please use at least a 1d2 (1 dice with 2 sides)");
            

            // Limits the input to 50d50
            if (numDices > 50 || numSides > 50) 
                return message.reply("Maximum of 50 dices with 50 sides");
            

            // Roll the dices
            const rolls = Array.from({ length: numDices }, () => Math.floor(Math.random() * numSides) + 1);
            const total = rolls.reduce((acc, cur) => acc + cur, 0);

            RollEmbed = embedGenerator.info({
                title: `Rolling **${numDices}d${numSides}**...`,
                fields: [
                    { name: "Rolls", value: rolls.join(", ") },
                    { name: "Total", value: total, inline: true },
                    { name: "Maximum possible", value: numDices * numSides, inline: true },
                ],
            }).withAuthor(message.author);

            message.reply({ embeds: [RollEmbed] });
        } else {
            // Roll 1d6 by default
            const roll = Math.floor(Math.random() * 6) + 1;
            RollEmbed = embedGenerator.info({
                title: "Rolling **1d6**...",
                fields: [
                    { name: "Roll", value: roll },
                ],
            }).withAuthor(message.author);
            
            message.reply({ embeds: [RollEmbed] });
        }
    },
};