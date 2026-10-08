const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "fact",
    description: "Get a random fact",
    category: "fun",

    /**
     * @param {import("@utils/log")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    async execute(logger, client, message, args, flags) {
        try {
            const fact = await (await fetch("https://uselessfacts.jsph.pl/random.json?language=en")).json();

            FactEmbed = {
                color: 0xffffff,
                title: "Random fact",
                description: fact.text,
                timestamp: new Date(),
            };

            message.reply({ embeds: [FactEmbed] });
        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error("An error occured")] });
        }
    },
};