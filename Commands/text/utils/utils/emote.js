const { createCanvas, loadImage } = require("canvas");
const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "emote",
    description: "Makes the attachment into a server emote/sticker",
    category: "utils",
    usage: {
        required: {
            "name": "Name of the sticker/emote",
        },
        optional: {
            "emote|e": {
                hasValue: false,
                description: "Generate a emote. Either -e or -s has to be passed",
            },
            "sticker|s": {
                hasValue: false,
                description: "Generate a sticker. Either -e or -s has to be passed",
            },
        },
    },
    examples: ["-e sus", "greatStickerName -s"],
    permissions: ["CreateGuildExpressions"],
    admin: true,
    async execute(logger, client, message, args, found) {
        const emoteArg = found["emote|e"];
        const stickerArg = found["sticker|s"];
        if (emoteArg && stickerArg) return SendErrorEmbed(message, "You can't use both -e and -s", "yellow");
        if (!emoteArg && !stickerArg) return SendErrorEmbed(message, "You have to use either -e or -s", "yellow");
        if (!args[0]) return SendErrorEmbed(message, "You have to specify a name for the emote/sticker", "yellow");
        
        const tag = ":dotted_line_face:";
        const name = args[0].toString();

        const imageAttachment = message.attachments.first();
        if (!imageAttachment || !imageAttachment.attachment) return SendErrorEmbed(message, "Invalid attachment", "yellow");

        const canvas = createCanvas(128, 128); 
        const ctx = canvas.getContext("2d");
        const img = await loadImage(imageAttachment.url);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const buffer = canvas.toBuffer();
        
        if (emoteArg) {
            message.guild.emojis.create({ attachment: buffer, name: name })
                .then(emoji => message.reply({ content: `Emote added: **${emoji.name}**` }))
                .catch((err) => {
                    SendErrorEmbed(message, "An error occured", "red");
                    logger.error(err.stack);
                });
        } 
        
        if (stickerArg) {
            message.guild.stickers.create({ file: buffer, name: name, tags: tag })
                .then(sticker => message.reply({ content: `Sticker added: **${sticker.name}**` }))
                .catch((err) => {
                    SendErrorEmbed(message, "An error occured", "red");
                    logger.error(err);
                });
        }
    },
};
