const { SendErrorEmbed } = require("@functions/discordFunctions");
const { AttachmentBuilder } = require("discord.js");
const FetchReddit = require("@functions/FetchReddit.js");

module.exports = {
    name: "otter",
    description: "birb pics!",
    category: "posts",
    private: true,
    async execute(logger, client, message, args, found) {
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw, ["otters"], 5)] });
    },
};