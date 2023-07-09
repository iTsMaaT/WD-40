const FetchReddit = require("@functions/FetchReddit.js");

module.exports = {
    name: 'quebec',
    description: 'Good luck',
    category: "posts",
    async execute(logger, client, message, args) {
        message.channel.sendTyping();
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw, "quebec", "quebeclibre", "metaquebec")] });
    }
};