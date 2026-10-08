const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "emojify",
    description: "Transform a string into emotes",
    usage: {
        required: {
            "string": "The text that will be manipulated",
        },
    },
    category: "text manipulation",
    examples: ["Hello, World!"],

    /**
     * @param {import("@utils/log")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    async execute(logger, client, message, args, flags) {

        // Map of all characters to emotes
        const emoteMap = {
            "a": "🇦",
            "b": "🇧",
            "c": "🇨",
            "d": "🇩",
            "e": "🇪",
            "f": "🇫",
            "g": "🇬",
            "h": "🇭",
            "i": "🇮",
            "j": "🇯",
            "k": "🇰",
            "l": "🇱",
            "m": "🇲",
            "n": "🇳",
            "o": "🇴",
            "p": "🇵",
            "q": "🇶",
            "r": "🇷",
            "s": "🇸",
            "t": "🇹",
            "u": "🇺",
            "v": "🇻",
            "w": "🇼",
            "x": "🇽",
            "y": "🇾",
            "z": "🇿",
            "0": "0️⃣",
            "1": "1️⃣",
            "2": "2️⃣",
            "3": "3️⃣",
            "4": "4️⃣",
            "5": "5️⃣",
            "6": "6️⃣",
            "7": "7️⃣",
            "8": "8️⃣",
            "9": "9️⃣",
            "!": "❗",
            "?": "❓",
            "#": "#️⃣",
            "*": "*️⃣",
            "+": "➕",
            "-": "➖",
            "÷": "➗",
            "$": "💲",
            ".": "🔵",
            ",": "🔻",
            "<": "⬅",
            ">": "➡",
            "^": "🔺",
        };

        if (!args[0]) return await message.reply({ embeds: [embedGenerator.warning("You need a prompt")] });

        // Use emote mapping or original character if mapping doesn't exist
        const emotesPromt = Array.from(args.join("🌌").toLowerCase()).map((char) => emoteMap[char] || char).join(" ");

        if (emotesPromt.length > 1000) return await message.reply({ embeds: [embedGenerator.error("The result is too long (>1000)")] });

        message.reply(emotesPromt);
    },
};