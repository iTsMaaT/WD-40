const FetchReddit = require("@root/utils/reddit/fetchReddit.js");

module.exports = {
    name: "cat",
    description: "Cats!",
    category: "posts",
    async execute(logger, client, message, args, optionalArgs) {
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw, ["cat", "cats", "aww", "catswithjobs", "blackpussy", "catswithdogs"], 5)] });
    },
};