const got = require('got');
const SendErrorEmbed = require("@functions/SendErrorEmbed.js");

module.exports = {
    name: 'bird',
    description: 'birb pics!',
    category: "posts",
    async execute(logger, client, message, args) {
        message.channel.sendTyping();

        if (message.channel.nsfw) {
            await got("http://shibe.online/api/birds")
                .then(response => {
                    var url = JSON.parse(response.body)[0];

                    NekoEmbed = {
                        color: 0xffffff,
                        title: `Enjoy!`,
                        image: {
                            url: url,
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