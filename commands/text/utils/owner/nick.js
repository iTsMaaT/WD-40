const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "nick",
    description: "Changes the server nickname",
    category: "owner",
    usage: {
        required: {
            "nickname": "nickname to set",
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
        try {
            const newNickname = args.join(" ");
            const member = message.guild.members.cache.get(client.user.id);
            
            await member.setNickname(newNickname || null);
            await message.reply({ embeds: [embedGenerator.success(`Server nickname changed to ${newNickname || "default"}`)] });
        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error("Nickname change failed.")] });
        }
    },
};