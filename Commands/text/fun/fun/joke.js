const got = require("got");

module.exports = {
    name: "joke",
    description: "le funny",
    category: "fun",
    async execute(logger, client, message, args) {

        await got("https://v2.jokeapi.dev/joke/Any")
            .then(response => {
                var joke = JSON.parse(response.body);

                let trueFlags = [];

                for (const flag in joke.flags) {
                    if (Object.prototype.hasOwnProperty.call(joke.flags, flag) && joke.flags[flag] === true) {
                        trueFlags.push(flag);
                    }
                }

                if (trueFlags.length === 0) trueFlags = ["None"];

                FactEmbed = {
                    color: 0xffffff,
                    title: `The joke:`,
                    description: `Catagory: ${joke.category}\nFlags: ${trueFlags.join(", ")}\n\n ${joke.setup ?? joke.joke} \n ${joke.delivery ?? ""}`,
                    timestamp: new Date(),
                    footer: { text: `ID : ${joke.id}` }
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
