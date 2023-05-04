const request = require('request');

module.exports = {
    name: "rule34",
    description: "Fetches a post using the rule34.xxx API, and can accept tags",
    category: "NSFW",
    execute: async (logger, client, message, args) => {
        if (message.channel.nsfw) {
            try {
                const url = 'http://rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&tags=' + args.join('+');
                request(url, (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        if (!body) return message.reply("An error occured, probably a invalid tag.");
                        const data = JSON.parse(body);
                        const post = data[Math.floor(Math.random() * data.length)];
                        message.channel.send(post.file_url);
                    } else {
                        logger.error(error);
                    }

                });
            } catch (err) {
                message.reply("An error occured, probably a invalid tag.");
                logger.error(error);
            }
        } else {
            message.reply({ content: "The channel you are in isn't NSFW", allowedMentions: { repliedUser: false } });
        }
    },
};
