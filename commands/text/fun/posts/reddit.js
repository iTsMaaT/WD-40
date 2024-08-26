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
            "subreddit|s": {
                hasValue: true,
                description: "subreddit to fetch from. Either -u or -s has to be passed",
            },
        },
    },
    category: "fun",
    examples: ["-p aww", "-u spez"],
    cooldown: 3000,
    async execute(logger, client, message, args, optionalArgs) {
        const sub = optionalArgs["subreddit|s"];
        const user = optionalArgs["user|u"];
        try {
            if (sub) 
                message.reply({ embeds: [await FetchReddit(message.channel.nsfw, [sub], 5, "sub")] });
            else if (user) 
                message.reply({ embeds: [await FetchReddit(message.channel.nsfw, [user], 5, "user")] });
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
