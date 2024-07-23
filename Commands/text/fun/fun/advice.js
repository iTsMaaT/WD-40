const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "advice",
    description: "Get a random advice",
    category: "fun",
    async execute(logger, client, message, args, optionalArgs) {
        const advice = await (await fetch("https://api.adviceslip.com/advice")).json();
        try {
            FactEmbed = embedGenerator.info({
                title: "Random advice",
                description: advice.slip.advice,
                footer: { text: `ID : ${advice.slip.id}` },
            });

            message.reply({ embeds: [FactEmbed] });
        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error("An error occured")] });
        }
    },
};