const FetchReddit = require("@functions/FetchReddit.js");

module.exports = {
    name: "meme",
    description: "Fetches a random post from a random shitpost sub (I hate meme subs)",
    category: "posts",
    async execute(logger, client, message, args) {
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw, "shitposting", "doodoofard", "okmatecrosseur", "the_pack", "whenthe", "wordington", "dankmemes")] });
    },
};