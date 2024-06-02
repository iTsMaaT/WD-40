const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "cat",
    description: "Cats!",
    category: "posts",
    async execute(logger, client, message, args) {
        try {
            const url = await (await fetch("http://shibe.online/api/cats")).json();
            const embed = {
                color: 0xffffff,
                title: "Enjoy!",
                image: {
                    url: url[0],
                },
                timestamp: new Date(),
            };

            message.reply({ embeds: [embed] });
        } catch (err) {
            return SendErrorEmbed(message, "Error fetching the image", "red");
        }
    },
};