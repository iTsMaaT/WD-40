const sharp = require("sharp");
const { AttachmentBuilder } = require("discord.js");
const { PermissionFlagsBits } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "imagefuck",
    description: "Transform a string into imagefuck",
    usage: {
        required: {
            "string": "The text that will be manipulated",
        },
    },
    category: "text manipulation",
    examples: ["Hello, World!"],
    permission: [PermissionFlagsBits.AttachFiles],
    async execute(logger, client, message, args, optionalArgs) {
        if (!args[0]) return await message.reply({ embeds: [embedGenerator.warning("Please provide a string to translate")] });

        const prompt = args.join(" ");

        const colourToBf = {
            "255,0,0": ">",
            "0,255,0": ".",
            "0,0,255": "<",
            "255,255,0": "+",
            "0,255,255": "-",
            "255,0,188": "[",
            "255,128,0": "]",
            "102,0,204": ",",
        };

        // Dynamic pixel size based on word length to maintain consistent image size
        const basePixelSize = 10; // Base pixel size for larger words
        const buffer = await createImage(stringToBF(prompt), Math.max(basePixelSize, Math.floor(500 / prompt.length)));
        const img = new AttachmentBuilder(buffer, { name: "img.png" });

        const embed = {
            title: "ImageFuck code",
            color: 0xffffff,
            image: {
                url: "attachment://img.png",
            },
            timestamp: new Date(),
        };

        message.reply({ embeds: [embed], files: [img] });

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

        async function createImage(source, pixelSize) {
            const bfToColour = {};
            for (const key in colourToBf) 
                bfToColour[colourToBf[key]] = key;
            
            const colours = [];
            for (const char of source) {
                if (bfToColour[char]) 
                    colours.push(bfToColour[char].split(",").map(Number));
            }
        
            const pixelsPerRow = Math.ceil(Math.sqrt(colours.length));
            const canvasSize = pixelsPerRow * pixelSize; // Calculate the canvas size based on pixelSize
        
            const imageBuffer = Buffer.alloc(canvasSize * canvasSize * 3); // RGB (3 channels per pixel)
        
            for (let i = 0; i < colours.length; i++) {
                const [r, g, b] = colours[i];

                // Calculate the position for this pixel
                const x = i % pixelsPerRow;
                const y = Math.floor(i / pixelsPerRow);
        
                // Calculate the index in the image buffer (RGB values for the pixel)
                const index = (y * pixelsPerRow + x) * 3; // 3 values per pixel (RGB)
        
                // Set the pixel's color in the buffer
                imageBuffer[index] = r;
                imageBuffer[index + 1] = g;
                imageBuffer[index + 2] = b;
            }
        
            // Use sharp to create an image from the buffer, resizing is not needed
            return sharp(imageBuffer, {
                raw: {
                    width: pixelsPerRow,
                    height: pixelsPerRow,
                    channels: 3,
                },
            })
                .resize({ width: canvasSize, height: canvasSize, kernel: sharp.kernel.nearest }) // Use nearest neighbor for sharp pixel effect
                .png() // Convert the image to PNG format
                .toBuffer(); // Return the buffer
        }
    },
};
