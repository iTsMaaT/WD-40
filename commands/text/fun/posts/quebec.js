const FetchReddit = require("@root/utils/reddit/fetchReddit.js");

module.exports = {
    name: "quebec",
    description: "Good luck",
    category: "posts",
    async execute(logger, client, message, args, flags) {
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw || message.guild && Number(message.guild.nsfwLevel) >= 1, ["quebec", "quebeclibre", "metaquebec"], 6)] });
    },
};