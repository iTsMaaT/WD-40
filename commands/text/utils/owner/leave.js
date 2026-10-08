const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "leave",
    description: "leaves the specified guild",
    category: "owner",
    usage: {
        required: {
            "guild": "ID of the guild to leave",
        },
    },
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
        let guild;
        try {
            if (args[0]) 
                guild = await message.client.guilds.cache.get(args[0]);
            else 
                guild = await message.client.guild.cache.get(message.guild.id);

            await guild.leave();
            await message.reply({ embeds: [embedGenerator.success(`Left ${guild.name}`)] });
        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error(`Failed to leave ${guild?.name || args[0] || message.guild.name}`)] });
        }
    },
};