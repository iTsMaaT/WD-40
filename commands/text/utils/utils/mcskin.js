const { multipleImageEmbed } = require("@functions/discordFunctions");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "mcskin",
    description: "Gives the Minecraft skin of a user",
    usage: {
        required: {
            "username / UUID": "the username or UUID of the user",
        },
    },
    category: "utils",
    examples: ["Notch"],

    /**
     * @param {import("@utils/log")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    async execute(logger, client, message, args, flags) {
        const name = args[0] ?? "mhf_steve";
    
        try {
            const embed = {
                title: `Minecraft skin for **${args[0] ?? "Steve"}**`,
                color: 0xffffff,
                thumbnail: {
                    url: `https://mc-heads.net/avatar/${name}`,
                },
                timestamp: new Date(),
                footer: { text: "Defaults to Steve if no arguments are provided" },
            };
            message.reply({ embeds: multipleImageEmbed(embed, `https://mc-heads.net/skin/${name}`, `https://mc-heads.net/user/${name}`, `https://mc-heads.net/body/${name}`) });
        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error("An unknown error occured")] });
        }
    },
};