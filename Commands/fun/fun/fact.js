const got = require("got")
module.exports = {
    name: "fact",
    description: "Get a random fact",
    category: "fun",
    execute(logger, client, message, args) {

        got("https://uselessfacts.jsph.pl/random.json?language=en")
            .then(response => {
                const fact = JSON.parse(response.body)
                message.channel.send(`
**Random fact**:
${fact.text}
            `)
            })
            .catch((err) => {
                message.channel.send(`An error occorred: ${err}`)
                logger.error(err)
            })
    }
}