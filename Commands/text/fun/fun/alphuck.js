const SendErrorEmbed = require("../../../../utils/functions/SendErrorEmbed");
const fs = require("fs/promises");

module.exports = {
    name: "alphuck",
    description: "Translates a string to alphuck",
    category: "fun",
    usage: "< String >",
    async execute(logger, client, message, args) {
        message.channel.sendTyping();
        if (!args[0]) return SendErrorEmbed(message, "Please provide a string to translate", "yellow");
        const bf = brainfuckToAlphuck(stringToBF(args.join(" ")));
        try {
            if (bf.length < 2000) {
                await message.reply(`\`\`\`alphuck\n${bf}\`\`\``);
            } else {
                const discriminator = Math.floor(Math.random() * 99999) + 1;
                fs.writeFile(`./bf-${discriminator}.txt`, bf.toString(), { encoding: "utf8" });
                await message.reply({ files: [`./bf-${discriminator}.txt`] });
                fs.unlink(`./bf-${discriminator}.txt`);
            }
        } catch(err) {
            logger.error(err.stack);
            return SendErrorEmbed(message, "An error occured", "red");
        }

        function charToBF(char) {
            let buffer = "[-]>[-]<";
            for (let i = 0; i < Math.floor(char.charCodeAt(0) / 10); i++) {
                buffer += "+";
            }
            buffer += "[>++++++++++<-]>";
            for (let i = 0; i < char.charCodeAt(0) % 10; i++) {
                buffer += "+";
            }
            buffer += ".<";
            return buffer;
        }
          
        function deltaToBF(delta) {
            let buffer = "";
            for (let i = 0; i < Math.floor(Math.abs(delta) / 10); i++) {
                buffer += "+";
            }
          
            if (delta > 0) {
                buffer += "[>++++++++++<-]>";
            } else {
                buffer += "[>----------<-]>";
            }
          
            for (let i = 0; i < Math.abs(delta) % 10; i++) {
                if (delta > 0) {
                    buffer += "+";
                } else {
                    buffer += "-";
                }
            }
            buffer += ".<";
            return buffer;
        }
          
        function stringToBF(string, commented) {
            let buffer = "";
            if (string === null || string === undefined) {
                return buffer;
            }
            for (let i = 0; i < string.length; i++) {
                if (i === 0) {
                    buffer += charToBF(string[i]);
                } else {
                    const delta = string.charCodeAt(i) - string.charCodeAt(i - 1);
                    buffer += deltaToBF(delta);
                }
                if (commented) {
                    buffer += " " + string[i].replace(/[+-<>[],.]/g, "") + "\n";
                }
            }
            return buffer;
        }

        function brainfuckToAlphuck(brainfuckCode) {
            // Replace Brainfuck characters with Alphuck characters
            const conversionMap = {
                '>': 'a',
                '<': 'c',
                '+': 'e',
                '-': 'i',
                '.': 'j',
                ',': 'o',
                '[': 'p',
                ']': 's'
            };
          
            // Convert Brainfuck code to Alphuck code
            let alphuckCode = '';
            for (let i = 0; i < brainfuckCode.length; i++) {
                const character = brainfuckCode[i];
                if (Object.prototype.hasOwnProperty.call(conversionMap, character)) {
                    alphuckCode += conversionMap[character];
                }
            }
          
            return alphuckCode;
        }
    }
};