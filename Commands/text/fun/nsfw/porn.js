const got = require("got");

module.exports = {
    name: 'porn',
    description: 'pornography',
    category: "NSFW",
    async execute(logger, client, message, args) {
        message.channel.sendTyping();

        if (message.channel.nsfw) {
            await got("https://nekobot.xyz/api/image?type=pgif")
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

                    message.reply({ embeds: [Embed], allowedMentions: { repliedUser: false } });
                });
        } else {
            return SendErrorEmbed(message, "The channel you are in isn't NSFW", "yellow");
        }
    }
};