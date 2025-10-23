const embedGenerator = require("@utils/helpers/embedGenerator");
const FetchReddit = require("@root/utils/reddit/fetchReddit.js");

module.exports = {
    name: "reddit",
    description: "Finds an image or post from *any* subreddit",
    usage: {
        optional: {
            "user|u": {
                hasValue: true,
                description: "username of the user. Either -u or -s has to be passed",
            },
            "subreddit|s|p": {
                hasValue: true,
                description: "subreddit to fetch from. Either -u or -s has to be passed",
            },
            "image|i": {
                hasValue: false,
                description: "Fetch an image instead of a post",
            },
        },
    },
    category: "fun",
    examples: ["-p aww", "-u spez"],
    cooldown: 3000,
    async execute(logger, client, message, args, flags) {
        const sub = flags["subreddit|s|p"];
        const user = flags["user|u"];
        try {
            if (sub) 
                message.reply({ embeds: [await FetchReddit(message.channel.nsfw, [sub], 5, "sub", flags["image|i"] ? "image" : "text")] });
            else if (user) 
                message.reply({ embeds: [await FetchReddit(message.channel.nsfw, [user], 5, "user", flags["image|i"] ? "image" : "text")] });
            else 
                return await message.reply({ embeds: [embedGenerator.warning("Wrong argument usage, please refer to `help reddit`")] });
            
        } catch (err) {
            if (err.toString().startsWith("SyntaxError: Unexpected token")) {
                logger.error("Reddit API error");
                return await message.reply({ embeds: [embedGenerator.error("Reddit API error, please try again later.")] });
            }
        }
    },
};
