const got = require('got');

module.exports = {
    name: 'dog',
    description: 'Not cats!',
    category: "posts",
    async execute(logger, client, message, args) {

        await got("https://dog.ceo/api/breeds/image/random")
            .then(response => {
                var url = JSON.parse(response.body);

                const embed = {
                    color: 0xffffff,
                    title: `Enjoy!`,
                    image: {
                        url: url.message,
                    },
                    timestamp: new Date(),
                };

                message.reply({ embeds: [embed] });
            });

    }
};