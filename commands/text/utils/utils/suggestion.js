const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "suggestion",
    description: "Suggest ideas for the bot",
    usage: {
        required: {
            "suggestion": "The suggestion you want to send",
        },
    },
    category: "utils",

    /**
     * @param {import("@utils/log")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    async execute(logger, client, message, args, flags) {

        if (!process.env.SUGGESTION_CHANNEL_ID) return await message.reply({ embeds: [embedGenerator.error("No suggestion channel has been set by the owner.")] });

        const channel = await client.channels.fetch(process.env.SUGGESTION_CHANNEL_ID);
        const sent = await channel.send(`**Suggestion by ${message.author.displayName} (<@${message.author.id}>) received: **` + args.join(" "));
        await channel.send("===================");
        await sent.react("🔴");
        await sent.react("🟢");
        await sent.react("✅");
        logger.info("Suggestion received");
        await message.reply({ embeds: [embedGenerator.info("Your suggestion has been sent.\nFor a bug report, you can join the support server by doing >help")] });
    },
};
