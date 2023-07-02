const FetchReddit = require("../../../../utils/functions/FetchReddit.js");

module.exports = {
    name: 'furry',
    description: 'Fetches a random post from one of three furry subreddits UwU',
    category: "NSFW",
    async execute(logger, client, message, args) {
        message.channel.sendTyping();
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw, "furrypornsubreddit", "yiff", "furryonhuman")] });
    }
};

