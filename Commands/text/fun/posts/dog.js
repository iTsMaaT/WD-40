const got = require('got');
const SendErrorEmbed = require("../../../../utils/functions/SendErrorEmbed.js");

module.exports = {
    name: 'dog',
    description: 'Not cats!',
    category: "posts",
    async execute(logger, client, message, args) {
        message.channel.sendTyping();

        if (message.channel.nsfw) {
            await got("https://dog.ceo/api/breeds/image/random")
                .then(response => {
                    var url = JSON.parse(response.body);

                    NekoEmbed = {
                        color: 0xffffff,
                        title: `Enjoy!`,
                        image: {
                            url: url.message,
                        },
                        timestamp: new Date(),
                    };

                    message.reply({ embeds: [NekoEmbed] });
                });
        } else {
            return SendErrorEmbed(message, "The channel you are in isn't NSFW", "yellow");
        }
    }
};