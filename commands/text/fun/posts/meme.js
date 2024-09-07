const FetchReddit = require("@root/utils/reddit/fetchReddit.js");

module.exports = {
    name: "meme",
    description: "Fetches a random post from a random shitpost sub",
    category: "posts",
    async execute(logger, client, message, args, optionalArgs) {
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw, ["shitposting", "the_pack", "whenthe", "memes", "meme"], 5)] });
    },
};