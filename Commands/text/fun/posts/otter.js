const { SendErrorEmbed } = require("@functions/discordFunctions");
const { AttachmentBuilder } = require("discord.js");

module.exports = {
    name: "otter",
    description: "birb pics!",
    category: "posts",
    private: true,
    async execute(logger, client, message, args, found) {
        try {
            const blob = await (await fetch("https://otter.bruhmomentlol.repl.co/random")).blob();
            const file = new AttachmentBuilder(Buffer.from(await blob.arrayBuffer()), { name: "otter.jpg" });
            const embed = {
                color: 0xffffff,
                title: "Enjoy!",
                image: {
                    url: "attachment://otter.jpg",
                },
                timestamp: new Date(),
            };

            message.reply({ embeds: [embed], files: [file] });
        } catch (err) {
            console.logger(err);
            return SendErrorEmbed(message, "Error fetching the image", "red");
        }
    },
};