const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
module.exports = {
    name: 'roll',
    description: 'Roll between 1 and 250 dices of up to 250 sides. Defaults to rolling 1d6.',
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

        //Limits the input to 500d500
        if (numDices > 250 || numSides > 250) {
            return interaction.reply({ content: 'Maximum of 500 dices with 500 sides', ephemeral: true });
        }

        // Roll the dices
        const rolls = Array.from({ length: numDices }, () => Math.floor(Math.random() * numSides) + 1);
        const total = rolls.reduce((acc, cur) => acc + cur, 0);

        interaction.reply({
            content: `
Rolling **${numDices}d${numSides}**...
**${rolls.join(', ')}**\nTotal: **${total}**
            ` 
        });
    },
};