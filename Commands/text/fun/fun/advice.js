module.exports = {
    name: "advice",
    description: "Get a random advice",
    category: "fun",
    async execute(logger, client, message, args) {
        const advice = await (await fetch("https://api.adviceslip.com/advice")).json();
        try {
            FactEmbed = {
                color: 0xffffff,
                title: "Random advice",
                description: advice.slip.advice,
                timestamp: new Date(),
                footer: { text: `ID : ${advice.slip.id}` },
            };

            message.reply({ embeds: [FactEmbed] });
        } catch (err) {
            ErrEmbed = {
                color: 0xff0000,
                title: "An error occured",
                description: err,
                timestamp: new Date(),
            };
            message.reply({ embeds: [ErrEmbed] });
            logger.error(err);
        }
    },
};