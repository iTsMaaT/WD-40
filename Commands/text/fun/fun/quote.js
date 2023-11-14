const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "quote",
    description: "Create a quote using the InspiroBot AI",
    category: "fun",
    usage: "< [Any]: Text quote, -i: image>",
    async execute(logger, client, message, args) {
        let QuoteEmbed;
        if (!args[0]) {
            const quote = await (await fetch("https://inspirobot.me/api?generateFlow=1")).json();
            const quoteText = quote.data.filter(x => x.type == "quote")[0].text.replace(/(\[pause [0-9]+\])/g, "");

            QuoteEmbed = {
                color: 0xffffff,
                title: "AI generated quote",
                description: quoteText,
                timestamp: new Date(),
            };
        } else if (args[0] == "-i") {
            const image = await fetch("http://inspirobot.me/api?generate=true");
            QuoteEmbed = {
                color: 0xffffff,
                title: "AI generated quote",
                image: {
                    url: await image.text(),
                },
                timestamp: new Date(),
            };
        } else {
            return SendErrorEmbed(message, "Invalid argument (Do >help quote for more info)", "yellow");
        }
        message.reply({ embeds: [QuoteEmbed] });
    },
};