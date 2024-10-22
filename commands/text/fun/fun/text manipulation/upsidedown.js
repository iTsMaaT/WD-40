const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "upsidedown",
    description: "Reverts a prompt ʌǝɹʇᴉɔɐllʎ and yllatnoziroh",
    category: "text manipulation",
    usage: {
        required: {
            "string": "The text that will be manipulated",
        },
    },
    examples: ["Hello, World!"],
    aliases: ["ud"],
    async execute(logger, client, message, args, optionalArgs) {
        if (!args[0]) return await message.reply({ embeds: [embedGenerator.warning("You need to provide a prompt.")] });
        if (args.join(" ").length > 1000) return await message.reply({ embeds: [embedGenerator.error("The result is too long (>1000)")] });

        const prompt = args.join(" ");

        const conversionMap = {
            "a": "ɐ",
            "b": "q",
            "c": "ɔ",
            "d": "p",
            "e": "ǝ",
            "f": "ɟ",
            "g": "ƃ",
            "h": "ɥ",
            "i": "ᴉ",
            "j": "ɾ",
            "k": "ʞ",
            "m": "ɯ",
            "n": "u",
            "p": "d",
            "q": "b",
            "r": "ɹ",
            "t": "ʇ",
            "u": "n",
            "v": "ʌ",
            "w": "ʍ",
            "y": "ʎ",
            "A": "∀",
            "C": "Ɔ",
            "E": "Ǝ",
            "F": "Ⅎ",
            "G": "פ",
            "J": "ſ",
            "L": "˥",
            "M": "W",
            "P": "Ԁ",
            "T": "┴",
            "U": "∩",
            "V": "Λ",
            "W": "M",
            "Y": "⅄",
            ".": "˙",
            ",": "'",
            "?": "¿",
            "!": "¡",
            "'": ",",
            "_": "‾",
            "\"": "„",
            ";": "؛",
            "9": "6",
            "6": "9",
        };

        // Inverts the prompt
        const InvertedPrompt = prompt.split("").reverse().join(""); 
      
        // Converts the compatible characters to their upside down counterparts
        let resultText = "";
        for (let i = 0; i < InvertedPrompt.length; i++) {
            const character = InvertedPrompt[i];
            resultText += conversionMap[character] || InvertedPrompt[i];
        }

        const embed = {
            color: 0xffffff,
            description: resultText,
            timestamp: new Date(),
        };
        message.reply({ embeds: [embed] });
    },
};