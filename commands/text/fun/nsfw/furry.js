const FetchReddit = require("@root/utils/reddit/fetchReddit.js");

module.exports = {
    name: "furry",
    description: "Fetches a random post from one of three furry subreddits UwU",
    category: "NSFW",
    async execute(logger, client, message, args, flags) {
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw || message.guild && Number(message.guild.nsfwLevel) >= 1, ["furrypornsubreddit", "yiff", "furryonhuman"], 5)] });
    },
};

