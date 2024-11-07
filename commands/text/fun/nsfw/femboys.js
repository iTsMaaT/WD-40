const FetchReddit = require("@root/utils/reddit/fetchReddit.js");

module.exports = {
    name: "femboys",
    description: "Boys that are acting not like boys but that are boys",
    category: "NSFW",
    async execute(logger, client, message, args, optionalArgs) {
        message.reply({ embeds: [await FetchReddit(message.channel.nsfw, ["femboys", "traps"], 5)] });
    },
};

