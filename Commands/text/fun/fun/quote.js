const embedGenerator = require("@utils/helpers/embedGenerator");

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
        try {
            let QuoteEmbed;
            if (optionalArgs["image|i"]) {
                const image = await fetch("http://inspirobot.me/api?generate=true");
                QuoteEmbed = embedGenerator.info({
                    color: 0xffffff,
                    title: "AI generated quote",
                    image: {
                        url: await image.text(),
                    },
                    timestamp: new Date(),
                }).withAuthor(message.author);
            } else {
                const quote = await (await fetch("https://inspirobot.me/api?generateFlow=1")).json();
                const quoteText = quote.data.filter(x => x.type == "quote")[0].text.replace(/(\[pause [0-9]+\])/g, "");

                QuoteEmbed = embedGenerator.info({
                    color: 0xffffff,
                    title: "AI generated quote",
                    description: quoteText,
                    timestamp: new Date(),
                }).withAuthor(message.author);
            }
        
            message.reply({ embeds: [QuoteEmbed] });
        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error("An error occured")] });
        }
    },
};