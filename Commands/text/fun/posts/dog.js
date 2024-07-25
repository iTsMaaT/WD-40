const FetchReddit = require("@utils/reddit/FetchReddit.js");

module.exports = {
    name: "dog",
    description: "Not cats!",
    category: "posts",
    async execute(logger, client, message, args, optionalArgs) {
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw, ["catswithdogs", "dogpictures", "dog"], 5)] });
    },
};