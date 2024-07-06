const { SendErrorEmbed } = require("@functions/discordFunctions");
const FetchReddit = require("@utils/reddit/FetchReddit.js");

module.exports = {
    name: "cat",
    description: "Cats!",
    category: "posts",
    async execute(logger, client, message, args, optionalArgs) {
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw, ["cat", "cats", "aww", "catswithjobs", "blackpussy", "catswithdogs"], 5)] });
    },
};