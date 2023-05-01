const FetchReddit = require("../../../utils/functions/FetchReddit.js");

module.exports = {
    name: "test",
    description: "Test command",
    category: "fun",
    async execute(logger, client, message, args) {
        message.channel.send("Shut the fuck up");
    }
}
