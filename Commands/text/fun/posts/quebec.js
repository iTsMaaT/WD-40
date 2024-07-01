const FetchReddit = require("@functions/FetchReddit.js");

module.exports = {
    name: "quebec",
    description: "Good luck",
    category: "posts",
    async execute(logger, client, message, args, found) {
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw, ["quebec", "quebeclibre", "metaquebec"], 6)] });
    },
};