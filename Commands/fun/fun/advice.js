const got = require("got")
module.exports = {
    name: "advice",
    description: "Get a random advice",
    category: "fun",
    execute(logger, client, message, args) {
        message.channel.sendTyping();

        got("https://api.adviceslip.com/advice")
            .then(response => {
                const advice = JSON.parse(response.body)

                FactEmbed = {
                    color: 0xffffff,
                    title: `Random advice`,
                    description: advice.slip.advice,
                    timestamp: new Date(),
                    footer: { text: `ID : ${advice.slip.id}` }
                }

                message.reply({ embeds: [FactEmbed], allowedMentions: { repliedUser: false }} );
            })
            .catch((err) => {
                ErrEmbed = {
                    color: 0xff0000,
                    title: `An error occured`,
                    description: err,
                    timestamp: new Date(),
                }
                message.reply({ embeds: [ErrEmbed], allowedMentions: { repliedUser: false }} );
                logger.error(err)
            })
    }
}