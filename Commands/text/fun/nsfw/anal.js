const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "anal",
    description: "why",
    category: "NSFW",
    async execute(logger, client, message, args, found) {
        if (message.channel.nsfw) {
            const url = await (await fetch("https://nekobot.xyz/api/image?type=anal")).json();
            Embed = {
                color: 0xffffff,
                title: "Enjoy!",
                image: {
                    url: url.message,
                },
                timestamp: new Date(),
            };

            message.reply({ embeds: [Embed] });
        } else {
            return SendErrorEmbed(message, "The channel you are in isn't NSFW", "yellow");
        }
    },
};