const { SendErrorEmbed } = require("@functions/discordFunctions");
const FetchReddit = require("@utils/reddit/FetchReddit.js");

module.exports = {
    name: "bird",
    description: "birb pics!",
    category: "posts",
    async execute(logger, client, message, args, optionalArgs) {
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw, ["birdswitharms", "BirdsBeingDicks", "birding"], 5)] });
    },
};