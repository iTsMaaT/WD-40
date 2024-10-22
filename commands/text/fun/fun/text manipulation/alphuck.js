const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "alphuck",
    description: "Translates a string to alphuck",
    category: "text manipulation",
    usage: {
        required: {
            "string": "The text that will be manipulated",
        },
    },
    examples: ["Hello, World!"],
    async execute(logger, client, message, args, optionalArgs) {
        if (!args[0]) return await message.reply({ embeds: [embedGenerator.warning("Please provide a string to translate")] });

        const bf = brainfuckToAlphuck(stringToBF(args.join(" ")));

        // Tries to send the code
        try {
            if (bf.length < 2000) 
                await message.reply(`\`\`\`alphuck\n${bf}\`\`\``);
            else 
                return await message.reply({ embeds: [embedGenerator.warning("The result is too long (>2000)")] });
            
        } catch (err) {
            logger.error(err.stack);
            return await message.reply({ embeds: [embedGenerator.error("An error occured")] });
        }

        // Converts a char to brainfuck
        function charToBF(char) {
            let buffer = "[-]>[-]<";
            for (let i = 0; i < Math.floor(char.charCodeAt(0) / 10); i++) 
                buffer += "+";
            
            buffer += "[>++++++++++<-]>";
            for (let i = 0; i < char.charCodeAt(0) % 10; i++) 
                buffer += "+";
            
            buffer += ".<";
            return buffer;
        }
          
        // Converts a delta to brainfuck
        function deltaToBF(delta) {
            let buffer = "";
            for (let i = 0; i < Math.floor(Math.abs(delta) / 10); i++) 
                buffer += "+";
            
          
            if (delta > 0) 
                buffer += "[>++++++++++<-]>";
            else 
                buffer += "[>----------<-]>";
            
          
            for (let i = 0; i < Math.abs(delta) % 10; i++) {
                if (delta > 0) 
                    buffer += "+";
                else 
                    buffer += "-";
                
            }
            buffer += ".<";
            return buffer;
        }
          
        // Takes a string and translates it to brainfuck
        function stringToBF(string, commented) {
            let buffer = "";
            if (string === null || string === undefined) 
                return buffer;
            
            for (let i = 0; i < string.length; i++) {
                if (i === 0) {
                    buffer += charToBF(string[i]);
                } else {
                    const delta = string.charCodeAt(i) - string.charCodeAt(i - 1);
                    buffer += deltaToBF(delta);
                }
                if (commented) 
                    buffer += " " + string[i].replace(/[+-<>[],.]/g, "") + "\n";
                
            }
            return buffer;
        }

        // Takes the brainfuck code, and changes it to alphuck
        function brainfuckToAlphuck(brainfuckCode) {
            // Replace Brainfuck characters with Alphuck characters
            const conversionMap = {
                ">": "a",
                "<": "c",
                "+": "e",
                "-": "i",
                ".": "j",
                ",": "o",
                "[": "p",
                "]": "s",
            };
          
            // Convert Brainfuck code to Alphuck code
            let alphuckCode = "";
            for (let i = 0; i < brainfuckCode.length; i++) {
                const character = brainfuckCode[i];
                if (Object.prototype.hasOwnProperty.call(conversionMap, character)) 
                    alphuckCode += conversionMap[character];
                
            }
          
            return alphuckCode;
        }
    },
};