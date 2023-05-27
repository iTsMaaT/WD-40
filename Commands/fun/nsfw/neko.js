const got = require("got")
module.exports = {
    name: "neko",
    description: "meow mrrrr~~ ฅ(＾・ω・＾ฅ)",
    category: "NSFW",
    async execute(logger, client, message, args) {
        message.channel.sendTyping();

        if (message.channel.nsfw) {
            await got("https://nekos.life/api/neko")
                .then(response => {
                    var url = JSON.parse(response.body)

                    NekoEmbed = {
                        color: 0xffffff,
                        title: `Enjoy!`,
                        image: {
                            url: url.neko,
                        },
                        timestamp: new Date(),
                    }

                    message.reply({ embeds: [NekoEmbed], allowedMentions: { repliedUser: false } });
                })
        } else {
            ErrorEmbed = {
                color: 0xffff00,
                title: `The channel you are in isn't NSFW`,
                timestamp: new Date(),
            }
            message.reply({ embeds: [ErrorEmbed], allowedMentions: { repliedUser: false } });
        }
    }
}
