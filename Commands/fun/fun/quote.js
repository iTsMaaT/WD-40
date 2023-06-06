const got = require("got");
module.exports = {
    name: "quote",
    description: "Create a quote using the InspiroBot AI",
    category: "fun",
    usage: "< [Any]: Text quote, -i: image>",
    async execute(logger, client, message, args) {
        message.channel.sendTyping();
        if (!args[0]) {
            const quote = JSON.parse((await got(`https://inspirobot.me/api?generateFlow=1`)).body);
            const quoteText = quote.data.filter(x => x.type == "quote")[0].text.replace(/(\[pause [0-9]+\])/g, "");

            var QuoteEmbed = {
                color: 0xffffff,
                title: `AI generated quote`,
                description: quoteText,
                timestamp: new Date(),
            };
        } else if (args[0] == "-i") {
            const image = await got(`http://inspirobot.me/api?generate=true`);
            QuoteEmbed = {
                color: 0xffffff,
                title: `AI generated quote`,
                image: {
                    url: image.body,
                },
                timestamp: new Date(),
            };
        }
        message.reply({ embeds: [QuoteEmbed], allowedMentions: { repliedUser: false } });
    }
};