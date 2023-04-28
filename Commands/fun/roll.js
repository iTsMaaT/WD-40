module.exports = {
    name: 'roll',
    description: 'Roll between 1 and 5 dices of any amount of sides. Defaults to rolling 1d6 when no arguments are given.',
    execute(logger, client, message, args) {
        // Check if arguments are provided
        if (args.length > 0) {
            // Parse the number of dices and the number of sides per dice
            const [numDices, numSides] = args[0].split('d').map(str => parseInt(str));

            // Check if the input is valid
            if (isNaN(numDices) || isNaN(numSides) || numDices < 1 || numSides < 2) {
                return message.reply('The amount of dices or sides per dices is invalid, please use at least a 1d2 (1 dice with 2 sides)');
            }

            //Limits the input to 500d500
            if (numDices > 250 || numSides > 250) {
                return message.reply('Maximum of 500 dices with 500 sides');
            }

            // Roll the dices
            const rolls = Array.from({ length: numDices }, () => Math.floor(Math.random() * numSides) + 1);
            const total = rolls.reduce((acc, cur) => acc + cur, 0);

            message.channel.send(`
Rolling **${numDices}d${numSides}**...
**${rolls.join(', ')}**\nTotal: **${total}**
            `);
        } else {
            // Roll 1d6 by default
            const roll = Math.floor(Math.random() * 6) + 1;
            message.reply(`You rolled a ${roll}!`);
        }
    },
};