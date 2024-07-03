const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "quote",
    description: "Create a quote using the InspiroBot AI",
    category: "fun",
    usage: {
        optional: {
            "image|i": {
                hasValue: false,
                description: "Generate an image instead of a text quote",
            },
        },
    },
    async execute(logger, client, message, args, optionalArgs) {
        let QuoteEmbed;
        if (optionalArgs["image|i"]) {
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
            const quote = await (await fetch("https://inspirobot.me/api?generateFlow=1")).json();
            const quoteText = quote.data.filter(x => x.type == "quote")[0].text.replace(/(\[pause [0-9]+\])/g, "");

            QuoteEmbed = {
                color: 0xffffff,
                title: "AI generated quote",
                description: quoteText,
                timestamp: new Date(),
            };
        }
        
        message.reply({ embeds: [QuoteEmbed] });
    },
};