const { SendErrorEmbed } = require("@functions/discordFunctions");
const FetchReddit = require("@functions/FetchReddit.js");

module.exports = {
    name: "cat",
    description: "Cats!",
    category: "posts",
    async execute(logger, client, message, args, found) {
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw, ["cat", "cats", "aww", "catswithjobs", "blackpussy", "catswithdogs"], 5)] });
    },
};