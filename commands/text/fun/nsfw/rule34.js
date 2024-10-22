const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "rule34",
    description: "Fetches a post using the rule34.xxx API, and can accept tags",
    usage: {
        required: {
            "tags": "The filter tags, sperated by spaces",
        },
    },
    category: "NSFW",
    execute: async (logger, client, message, args, optionalArgs) => {
        if (!message.channel.nsfw) return await message.reply({ embeds: [embedGenerator.error("This command is only available in NSFW channels")] });
        try {
            const url = "http://rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&tags=" + args.join("+");
            const response = await fetch(url);

            const data = await response.json();
            const post = data[Math.floor(Math.random() * data.length)];

            const RuleEmbed = {
                color: 0xffffff,
                title: `Posted by: ${post.owner}`,
                image: {
                    url: post.file_url,
                },
                timestamp: new Date(),
            };
            message.reply({ embeds: [RuleEmbed] });
        } catch (err) {
            const RuleEmbed = {
                color: 0xff0000,
                title: "An error occured, probably a invalid tag",
                timestamp: new Date(),
            };
            message.reply({ embeds: [RuleEmbed] });
            logger.error(err);
        }
    },
};
