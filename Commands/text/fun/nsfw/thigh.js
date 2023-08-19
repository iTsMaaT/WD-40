const got = require("got");
const SendErrorEmbed = require("@functions/SendErrorEmbed");

module.exports = {
    name: 'thigh',
    description: 'leg',
    category: "NSFW",
    async execute(logger, client, message, args) {

        if (message.channel.nsfw) {
            await got("https://nekobot.xyz/api/image?type=thigh")
                .then(response => {
                    var url = JSON.parse(response.body);

                    Embed = {
                        color: 0xffffff,
                        title: `Enjoy!`,
                        image: {
                            url: url.message,
                        },
                        timestamp: new Date(),
                    };

                    message.reply({ embeds: [Embed] });
                });
        } else {
            return SendErrorEmbed(message, "The channel you are in isn't NSFW", "yellow");
        }
    }
};