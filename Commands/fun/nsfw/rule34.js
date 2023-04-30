const request = require('request');

module.exports = {
    name: "rule34",
    description: "Fetches a post using the rule34.xxx API, and can accept tags",
    category: "NSFW",
    execute: async (logger, client, message, args) => {
        if (message.channel.nsfw) {
            const url = 'http://rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&tags=' + args.join('+');
            request(url, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    const data = JSON.parse(body);
                    const post = data[Math.floor(Math.random() * data.length)];
                    message.channel.send(post.file_url);
                } else {
                    console.log(error);
                }
            });
        } else {
            message.reply({ content: "The channel you are in isn't NSFW", allowedMentions: { repliedUser: false } });
        }
    },
};
