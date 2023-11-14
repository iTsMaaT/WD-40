const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "ass",
    description: "dumbass",
    category: "NSFW",
    async execute(logger, client, message, args) {
        if (message.channel.nsfw) {
            const url = await (await fetch("https://nekobot.xyz/api/image?type=ass")).json();
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