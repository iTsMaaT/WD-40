const SendErrorEmbed = require("@functions/SendErrorEmbed.js");
const { createCanvas } = require('canvas');
const { AttachmentBuilder } = require("discord.js");

module.exports = {
    name: "imagefuck",
    description: "Transform a string into imagefuck",
    usage: "< [Prompt] >",
    category: "text manipulation",
    async execute(logger, client, message, args) {
        if (!args[0]) return SendErrorEmbed(message, "Please provide a string to translate", "yellow");

        const prompt = args.join(" ");

        const colourToBf = {
            '255,0,0': '>',
            '0,255,0': '.',
            '0,0,255': '<',
            '255,255,0': '+',
            '0,255,255': '-',
            '255,0,188': '[',
            '255,128,0': ']',
            '102,0,204': ','
        };

        const buffer = await createImage(stringToBF(prompt), 10);
        var img = new AttachmentBuilder(buffer, 'img.png');

        const embed = {
            title: `ImageFuck code`,
            color: 0xffffff,
            image: {
                url: 'attachment://file.jpg',
            },
            timestamp: new Date(),
        };

        message.reply({ embeds: [embed], files: [img] });

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

        //Converts a delta to brainfuck
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
        
        //Takes a string and translates it to brainfuck
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

        async function createImage(source, pixelSize) {
            const bfToColour = {};
            for (const key in colourToBf) {
                bfToColour[colourToBf[key]] = key;
            }
        
            const colours = [];
            for (const char of source) {
                if (bfToColour[char]) {
                    colours.push(bfToColour[char].split(',').map(Number));
                }
            }
        
            const pixelsPerRow = Math.ceil(Math.sqrt(colours.length));
            const canvasSize = pixelsPerRow * pixelSize; // Calculate the canvas size based on pixelSize
        
            const canvas = createCanvas(canvasSize, canvasSize);
            const context = canvas.getContext('2d');
        
            for (let i = 0; i < colours.length; i++) {
                const [r, g, b] = colours[i];
                context.fillStyle = `rgb(${r},${g},${b})`;
                
                // Calculate the positions in terms of pixelSize
                const x = (i % pixelsPerRow) * pixelSize;
                const y = Math.floor(i / pixelsPerRow) * pixelSize;
                
                context.fillRect(x, y, pixelSize, pixelSize);
            }
        
            return canvas.toBuffer();
        }
    },
};