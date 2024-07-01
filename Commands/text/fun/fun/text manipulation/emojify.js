const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "emojify",
    description: "Transform a string into emotes",
    usage: {
        required: {
            name: "string",
            description: "The text that will be manipulated",
        },
    },
    category: "text manipulation",
    examples: ["Hello, World!"],
    execute(logger, client, message, args, found) {

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

        if (!args[0]) SendErrorEmbed(message, "You need a prompt", "yellow");

        // Use emote mapping or original character if mapping doesn't exist
        const emotesPromt = Array.from(args.join("🌌").toLowerCase()).map((char) => emoteMap[char] || char).join(" ");

        if (emotesPromt.length > 1000) SendErrorEmbed(message, "Prompt too long", "yellow");

        const embed = {
            color: 0xffffff,
            title: "Emotified text",
            description: emotesPromt,
            timestamp: new Date(),
        };

        message.reply({ embeds: [embed] });
    },
};