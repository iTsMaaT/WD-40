const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "logs",
    description: "Shows the count of each type of log",
    category: "owner",
    private: true,

    /**
     * @param {import("@utils/log")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    async execute(logger, client, message, args, flags) {
        const logCounts = logger.logCounts;

        const embed = embedGenerator.info({
            title: "Log Statistics for this session",
            fields: [
                ...Object.keys(logCounts).map(type => ({
                    name: type.charAt(0).toUpperCase() + type.slice(1),
                    value: logCounts[type].toString(),
                    inline: true,
                })),
                { name: "Total", value: logger.getTotalLogCount(), inline: true },
                { name: "All-Time Total", value: await logger.getAllTimeLogCount(), inline: true },
            ],
            timestamp: new Date(),
        }).withAuthor(message.author);

        await message.reply({ embeds: [embed] });
    },
};