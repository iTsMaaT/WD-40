const got = require("got")
module.exports = {
    name: "quote",
    description: "Create a quote using the InspiroBot AI",
    category: "fun",
    async execute(logger, client, message, args) {
        message.channel.sendTyping();
        let quote = JSON.parse((await got(`https://inspirobot.me/api?generateFlow=1`)).body)
        let quoteText = quote.data.filter(x => x.type == "quote")[0].text.replace(/(\[pause [0-9]+\])/g, "")

        QuoteEmbed = {
            color: 0xffffff,
            title: `AI generated quote`,
            description: quoteText,
            timestamp: new Date(),
        }
        message.reply({ embeds: [QuoteEmbed], allowedMentions: { repliedUser: false } });
    }
}