const FetchReddit = require("@functions/FetchReddit.js");

module.exports = {
    name: 'cat',
    description: 'Cats!',
    category: "posts",
    async execute(logger, client, message, args) {
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw, "cat", "cats", "catswithjobs", "tightpussy", "backpussy", "illegallysmolcats")] });
    }
};