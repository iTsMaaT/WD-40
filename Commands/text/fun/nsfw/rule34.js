const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "rule34",
    description: "Fetches a post using the rule34.xxx API, and can accept tags",
    usage: "< [Any]: tags...>",
    category: "NSFW",
    execute: async (logger, client, message, args) => {

        if (message.channel.nsfw) {
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
        } else {
            return SendErrorEmbed(message, "The channel you are in isn't NSFW", "yellow");
        }
    },
};
