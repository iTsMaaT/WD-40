const got = require("got");
const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "neko",
    description: "meow mrrrr~~ ฅ(＾・ω・＾ฅ)",
    category: "NSFW",
    async execute(logger, client, message, args) {

        if (message.channel.nsfw) {
            await got("https://nekos.life/api/neko")
                .then(response => {
                    const url = JSON.parse(response.body);

                    NekoEmbed = {
                        color: 0xffffff,
                        title: "Enjoy!",
                        image: {
                            url: url.neko,
                        },
                        timestamp: new Date(),
                    };

                    message.reply({ embeds: [NekoEmbed] });
                });
        } else {
            return SendErrorEmbed(message, "The channel you are in isn't NSFW", "yellow");
        }
    },
};
