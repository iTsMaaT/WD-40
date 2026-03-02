const FetchReddit = require("@root/utils/reddit/fetchReddit.js");

module.exports = {
    name: "femboys",
    description: "Boys that are acting not like boys but that are boys",
    category: "NSFW",
    async execute(logger, client, message, args, flags) {
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw || message.guild && Number(message.guild.nsfwLevel) >= 1, ["femboys", "traps"], 5)] });
    },
};

