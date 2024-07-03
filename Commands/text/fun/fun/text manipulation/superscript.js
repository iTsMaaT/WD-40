const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "superscript",
    description: "Changes a text's characters to ˢᵁᴾᴱᴿˢᶜᴿᴵᴾᵀ",
    category: "text manipulation",
    usage: {
        required: {
            "string": "The text that will be manipulated",
        },
    },
    examples: ["Hello, World!"],
    async execute(logger, client, message, args, optionalArgs) {
        if (!args[0]) return SendErrorEmbed(message, "You need to provide a prompt.", "yellow");
        if (args.join(" ").length > 1000) return SendErrorEmbed(message, "The result is too long (>1000)", "yellow");

        const prompt = args.join(" ").toLowerCase();

        const conversionMap = {
            "a": "ᵃ",
            "b": "ᵇ",
            "c": "ᶜ",
            "d": "ᴰ",
            "e": "ᴱ",
            "f": "ᶠ",
            "g": "ᴳ",
            "h": "ᴴ",
            "i": "ᴵ",
            "j": "ᴶ",
            "k": "ᴷ",
            "l": "ᴸ",
            "m": "ᴹ",
            "n": "ᴺ",
            "o": "ᴼ",
            "p": "ᴾ",
            "q": "Q",
            "r": "ᴿ",
            "s": "ˢ",
            "t": "ᵀ",
            "u": "ᵁ",
            "v": "ν",
            "w": "ᵂ",
            "x": "ˣ",
            "y": "ʸ",
            "z": "ᶻ",
            "^": "^",
            "_": "_",
            "`": "`",
            "0": "⁰",
            "1": "¹",
            "2": "²",
            "3": "³",
            "4": "⁴",
            "5": "⁵",
            "6": "⁶",
            "7": "⁷",
            "8": "⁸",
            "9": "⁹",
            "(": "⁽",
            ")": "⁾",
        };
          
      
        // Converts the compatible characters to their superscript counterparts
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