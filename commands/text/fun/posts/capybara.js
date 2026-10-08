const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "capybara",
    description: "Cute but not cute according to chatGPT",
    category: "posts",

    /**
     * @param {import("@utils/log")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    async execute(logger, client, message, args, flags) {
        const image = await (await fetch("https://api.capy.lol/v1/capybara?json=true")).json();
        const embed = embedGenerator.info({
            title: "Random capybara",
            image: {
                url: image.data.url,
            },
        }).withAuthor(message.author);
        await message.reply({ embeds: [embed] });
    },
};