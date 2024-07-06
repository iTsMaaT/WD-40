const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "neko",
    description: "meow mrrrr~~ ฅ(＾・ω・＾ฅ)",
    category: "NSFW",
    async execute(logger, client, message, args, optionalArgs) {
        if (message.channel.nsfw) {
            const url = await (await fetch("https://nekos.life/api/neko")).json();
            Embed = {
                color: 0xffffff,
                title: "Enjoy!",
                image: {
                    url: url.neko,
                },
                timestamp: new Date(),
            };

            message.reply({ embeds: [Embed] });
        } else {
            return SendErrorEmbed(message, "The channel you are in isn't NSFW", "yellow");
        }
    },
};
