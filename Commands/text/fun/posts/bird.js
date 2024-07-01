const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "bird",
    description: "birb pics!",
    category: "posts",
    async execute(logger, client, message, args, found) {
        try {
            const url = await (await fetch("http://shibe.online/api/birds")).json();
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