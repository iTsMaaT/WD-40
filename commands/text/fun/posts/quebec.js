const FetchReddit = require("@root/utils/reddit/fetchReddit.js");

module.exports = {
    name: "quebec",
    description: "Good luck",
    category: "posts",
    async execute(logger, client, message, args, optionalArgs) {
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw, ["quebec", "quebeclibre", "metaquebec"], 6)] });
    },
};