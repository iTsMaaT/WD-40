const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "dog",
    description: "Not cats!",
    category: "posts",
    async execute(logger, client, message, args, found) {
        try {
            const url = await (await fetch("https://dog.ceo/api/breeds/image/random")).json();
            const embed = {
                color: 0xffffff,
                title: "Enjoy!",
                image: {
                    url: url.message,
                },
                timestamp: new Date(),
            };

            message.reply({ embeds: [embed] });
        } catch (err) {
            return SendErrorEmbed(message, "Error fetching the image", "red");
        }
    },
};