const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "morse",
    description: "Translates a string to morse code",
    category: "text manipulation",
    usage: {
        required: {
            "string": "The text that will be manipulated",
        },
    },
    examples: ["Hello, World!"],
    async execute(logger, client, message, args, optionalArgs) {
        if (!args[0]) return await message.reply({ embeds: [embedGenerator.error("You need to provide a prompt.")] });

        // All morse charaters
        const conversionMap = {
            "a": ".-",
            "b": "-...",
            "c": "-.-.",
            "d": "-..",
            "e": ".",
            "f": "..-.",
            "g": "--.",
            "h": "....",
            "i": "..",
            "j": ".---",
            "k": "-.-",
            "l": ".-..",
            "m": "--",
            "n": "-.",
            "o": "---",
            "p": ".--.",
            "q": "--.-",
            "r": ".-.",
            "s": "...",
            "t": "-",
            "u": "..-",
            "v": "...-",
            "w": ".--",
            "x": "-..-",
            "y": "-.--",
            "z": "--..",
            "0": "-----",
            "1": ".----",
            "2": "..---",
            "3": "...--",
            "4": "....-",
            "5": ".....",
            "6": "-....",
            "7": "--...",
            "8": "---..",
            "9": "----.",
            ",": "--..--",
            ".": ".-.-.-",
            "?": "..--..",
            ";": "-.-.-.",
            ":": "---...",
            "%": "---...",
            "/": "-..-.",
            "-": "-....-",
            "'": ".----.",
            "\"": ".-..-.",
            "_": "..--.-",
            "[": "-.--.",
            "(": "-.--.",
            "]": "-.---.-",
            ")": "-.---.-",
            "=": "-...-",
            "+": ".-.-.",
            "*": "-..-",
            "@": ".--.-.",
        };
      
        let morseCode = "";

        // for every word in the prompt
        for (word of args) {
            word = word.toLowerCase();

            // Itirates trough each letters of the word
            for (let i = 0; i < word.length; i++) {
                const character = word[i];

                // If it is in the list, convert it and add a space
                if (Object.prototype.hasOwnProperty.call(conversionMap, character)) {
                    morseCode += conversionMap[character];
                    morseCode += " ";
                }
            }

            // After each word, add a slash
            morseCode += " / ";
        }

        // Remove the last slash
        morseCode = morseCode.slice(0, -3);

        if (morseCode.length < 2000) 
            await message.reply(`\`\`\`${morseCode}\`\`\``);
        else 
            return await message.reply({ embeds: [embedGenerator.error("The result is too long (>2000)")] });
        
    },
};