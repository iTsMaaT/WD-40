const FetchReddit = require("../../../utils/functions/FetchReddit.js");

module.exports = {
    name: 'cat',
    description: 'Cats!',
    category: "posts",
    async execute(logger, client, message, args) {
        message.channel.sendTyping();
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw, "cat", "cats", "catswithjobs", "tightpussy", "backpussy", "illegallysmolcats")], allowedMentions: { repliedUser: false }});
    }
};