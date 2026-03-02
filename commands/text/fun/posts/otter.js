const FetchReddit = require("@root/utils/reddit/fetchReddit.js");

module.exports = {
    name: "otter",
    description: "birb pics!",
    category: "posts",
    private: true,
    async execute(logger, client, message, args, flags) {
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw || message.guild && Number(message.guild.nsfwLevel) >= 1, ["otters"], 5)] });
    },
};