const got = require("got");

module.exports = {
    name: "bird",
    description: "birb pics!",
    category: "posts",
    async execute(logger, client, message, args) {

        await got("https://otter.bruhmomentlol.repl.co/random")
            .then(response => {
                const url = JSON.parse(response.body)[0];

                const embed = {
                    color: 0xffffff,
                    title: "Enjoy!",
                    image: {
                        url: url,
                    },
                    timestamp: new Date(),
                };

                message.reply({ embeds: [embed] });
            });
    },
};