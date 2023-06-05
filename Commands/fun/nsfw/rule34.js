const got = require('got');

module.exports = {
    name: "rule34",
    description: "Fetches a post using the rule34.xxx API, and can accept tags",
    usage: "< [Any]: tags...>",
    category: "NSFW",
    execute: async (logger, client, message, args) => {
        message.channel.sendTyping();
        if (message.channel.nsfw) {
            try {
                const url = 'http://rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&tags=' + args.join('+');
                const response = await got(url);

                const data = JSON.parse(response.body);
                const post = data[Math.floor(Math.random() * data.length)];

                const RuleEmbed = {
                    color: 0xffffff,
                    title: `Posted by: ${post.owner}`,
                    image: {
                        url: post.file_url,
                    },
                    timestamp: new Date(),
                };
                message.reply({ embeds: [RuleEmbed], allowedMentions: { repliedUser: false } });
            } catch (err) {
                const RuleEmbed = {
                    color: 0xff0000,
                    title: `An error occured, probably a invalid tag`,
                    timestamp: new Date(),
                };
                message.reply({ embeds: [RuleEmbed], allowedMentions: { repliedUser: false } });
                logger.error(err);
            }
        } else {
            const RuleEmbed = {
                color: 0xffff00,
                title: `The channel you are in isn't NSFW`,
                timestamp: new Date(),
            };
            message.reply({ embeds: [RuleEmbed], allowedMentions: { repliedUser: false } });
        }
    },
};
