const FetchReddit = require("@root/utils/reddit/fetchReddit.js");

module.exports = {
    name: "minecraft",
    description: "Fetches a post from different Minecraft subreddits",
    category: "posts",
    async execute(logger, client, message, args, flags) {
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw || message.guild && Number(message.guild.nsfwLevel) >= 1, ["minecraftmemes", "minecraftbuilds", "mcpe", "technicalminecraft", "minecraftbedrockers"], 5)] });
    },
};