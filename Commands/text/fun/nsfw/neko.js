const got = require("got");
const getExactDate = require("../../../../utils/functions/getExactDate");
module.exports = {
    name: "neko",
    description: "meow mrrrr~~ ฅ(＾・ω・＾ฅ)",
    category: "NSFW",
    async execute(logger, client, message, args) {
        message.channel.sendTyping();

        if (message.channel.nsfw) {
            await got("https://nekos.life/api/neko")
                .then(response => {
                    var url = JSON.parse(response.body);

                    NekoEmbed = {
                        color: 0xffffff,
                        title: `Enjoy!`,
                        image: {
                            url: url.neko,
                        },
                        timestamp: new Date(),
                    };

                    message.reply({ embeds: [NekoEmbed], allowedMentions: { repliedUser: false } });
                });
        } else {
            return SendErrorEmbed(message, "The channel you are in isn't NSFW", "yellow");
        }
    }
};