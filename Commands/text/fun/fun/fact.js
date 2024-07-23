const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "fact",
    description: "Get a random fact",
    category: "fun",
    async execute(logger, client, message, args, optionalArgs) {
        try {
            const fact = await (await fetch("https://uselessfacts.jsph.pl/random.json?language=en")).json();

            FactEmbed = {
                color: 0xffffff,
                title: "Random fact",
                description: fact.text,
                timestamp: new Date(),
            };

            message.reply({ embeds: [FactEmbed] });
        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error("An error occured")] });
        }
    },
};