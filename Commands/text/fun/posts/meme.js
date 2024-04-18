const FetchReddit = require("@functions/FetchReddit.js");

module.exports = {
    name: "meme",
    description: "Fetches a random post from a random shitpost sub",
    category: "posts",
    cooldown: 10000,
    async execute(logger, client, message, args) {
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw, ["shitposting", "okmatecrosseur", "the_pack", "whenthe", "memes", "meme"], 5)] });
    },
};