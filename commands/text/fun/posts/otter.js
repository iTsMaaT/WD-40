const FetchReddit = require("@utils/reddit/FetchReddit.js");

module.exports = {
    name: "otter",
    description: "birb pics!",
    category: "posts",
    private: true,
    async execute(logger, client, message, args, optionalArgs) {
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw, ["otters"], 5)] });
    },
};