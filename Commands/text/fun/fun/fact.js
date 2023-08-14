const got = require("got");
module.exports = {
    name: "fact",
    description: "Get a random fact",
    category: "fun",
    execute(logger, client, message, args) {
        
        got("https://uselessfacts.jsph.pl/random.json?language=en")
            .then(response => {
                const fact = JSON.parse(response.body);

                FactEmbed = {
                    color: 0xffffff,
                    title: `Random fact`,
                    description: fact.text,
                    timestamp: new Date(),
                };

                message.reply({ embeds: [FactEmbed] });
            })
            .catch((err) => {
                FactEmbed = {
                    color: 0xff0000,
                    title: `An error occured`,
                    description: err,
                    timestamp: new Date(),
                };
                message.reply({ embeds: [FactEmbed] });
                logger.error(err);
            });
    }
};