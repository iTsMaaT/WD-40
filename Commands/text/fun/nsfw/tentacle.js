const got = require("got");
const SendErrorEmbed = require("../../../../utils/functions/SendErrorEmbed");

module.exports = {
    name: 'tentacle',
    description: 'long sus things entering holes',
    category: "NSFW",
    async execute(logger, client, message, args) {
        message.channel.sendTyping();

        if (message.channel.nsfw) {
            await got("https://nekobot.xyz/api/image?type=tentacle")
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