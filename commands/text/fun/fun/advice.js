const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "advice",
    description: "Get a random advice",
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
        const advice = await (await fetch("https://api.adviceslip.com/advice")).json();
        try {
            FactEmbed = embedGenerator.info({
                title: "Random advice",
                description: advice.slip.advice,
                footer: { text: `ID : ${advice.slip.id}` },
            });

            message.reply({ embeds: [FactEmbed] });
        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error("An error occured")] });
        }
    },
};