const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "neko",
    description: "meow mrrrr~~ ฅ(＾・ω・＾ฅ)",
    category: "NSFW",

    /**
     * @param {import("@utils/log")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    async execute(logger, client, message, args, flags) {
        if (!message.channel.nsfw) return await message.reply({ embeds: [embedGenerator.error("This command is only available in NSFW channels")] });
        const url = await (await fetch("https://nekos.life/api/neko")).json();
        
        const embed = embedGenerator.info({
            title: "Enjoy!",
            image: {
                url: url.neko,
            },
        }).withAuthor(message.author);

        message.reply({ embeds: [embed] });
    },
};
