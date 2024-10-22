const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "leet",
    description: "Converts a text to leet speech",
    category: "text manipulation",
    usage: {
        required: {
            "string": "The text that will be manipulated",
        },
    },
    examples: ["Hello, World!"],
    aliases: ["1337"],
    async execute(logger, client, message, args, optionalArgs) {
        if (!args[0]) return await message.reply({ embeds: [embedGenerator.warning("You need to provide a prompt.")] });
        if (args.join(" ").length > 1000) return await message.reply({ embeds: [embedGenerator.error("The result is too long (>1000)")] });

        const prompt = args.join(" ").toLowerCase();

        const conversionMap = {
            "a": "4",
            "b": "8",
            "c": "(",
            "d": ")",
            "e": "3",
            "f": "ƒ",
            "g": "6",
            "h": "#",
            "i": "1",
            "j": "]",
            "k": "|<",
            "l": "|",
            "m": "^^",
            "n": "ท",
            "o": "0",
            "p": "|º",
            "q": "2",
            "r": "9",
            "s": "5",
            "t": "7",
            "u": "บ",
            "v": "|_|",
            "w": "vv",
            "x": "}{",
            "y": "¥ ",
            "z": "%",
        };
        
      
        // Converts lowercase letters to small caps
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