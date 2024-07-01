const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "widetext",
    description: "ＭＡＫＥＳ Ａ ＴＥＸＴ ＷＩＤＥ",
    category: "text manipulation",
    usage: {
        required: {
            "string": "The text that will be manipulated",
        },
    },
    examples: ["Hello, World!"],
    aliases: ["wt"],
    async execute(logger, client, message, args, found) {
        if (!args[0]) return SendErrorEmbed(message, "You need to provide a prompt.", "yellow");
        if (args.join(" ").length > 1000) return SendErrorEmbed(message, "The result is too long (>1000)", "yellow");

        const prompt = args.join(" ").toLowerCase();

        const conversionMap = {
            "a": "Ａ",
            "b": "Ｂ",
            "c": "Ｃ",
            "d": "Ｄ",
            "e": "Ｅ",
            "f": "Ｆ",
            "g": "Ｇ",
            "h": "Ｈ",
            "i": "Ｉ",
            "j": "Ｊ",
            "k": "Ｋ",
            "l": "Ｌ",
            "m": "Ｍ",
            "n": "Ｎ",
            "o": "Ｏ",
            "p": "Ｐ",
            "q": "Ｑ",
            "r": "Ｒ",
            "s": "Ｓ",
            "t": "Ｔ",
            "u": "Ｕ",
            "v": "Ｖ",
            "w": "Ｗ",
            "x": "Ｘ",
            "y": "Ｙ",
            "z": "Ｚ",
            "#": "＃",
            "$": "＄",
            "%": "％",
            "&": "＆",
            "'": "＇",
            "(": "（",
            ")": "）",
            "*": "＊",
            "+": "＋",
            ",": "，",
            "-": "－",
            ".": "．",
            "/": "／",
            "0": "０",
            "1": "１",
            "2": "２",
            "3": "３",
            "4": "４",
            "5": "５",
            "6": "６",
            "7": "７",
            "8": "８",
            "9": "９",
            ":": "：",
            ";": "；",
            "<": "＜",
            "=": "＝",
            ">": "＞",
            "?": "？",
            "@": "＠",
        };
      
        // Converts the compatible characters to their big counterparts
        let resultText = "";
        for (let i = 0; i < prompt.length; i++) {
            const character = prompt[i];
            resultText += conversionMap[character] || prompt[i];
        }

        const embed = {
            color: 0xffffff,
            description: resultText,
            timestamp: new Date(),
        };
        message.reply({ embeds: [embed] });
    },
};