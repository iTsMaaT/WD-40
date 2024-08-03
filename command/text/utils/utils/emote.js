const { PermissionsBitField } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const embedGenerator = require("@utils/helpers/embedGenerator");

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
    examples: ["-e sus", "greatStickerName -s", "-e -s stickerAndEmoteName"],
    permissions: [PermissionsBitField.Flags.CreateGuildExpressions],
    admin: true,
    async execute(logger, client, message, args, optionalArgs) {
        const emoteArg = optionalArgs["emote|e"];
        const stickerArg = optionalArgs["sticker|s"];
        if (emoteArg && stickerArg) return await message.reply({ embeds: [embedGenerator.warning("You can't use both -e and -s")] });
        if (!emoteArg && !stickerArg) return await message.reply({ embeds: [embedGenerator.warning("You have to use either -e or -s")] });
        if (!args[0]) return await message.reply({ embeds: [embedGenerator.warning("You have to specify a name for the emote/sticker")] });
        
        const tag = ":dotted_line_face:";
        const name = args[0].toString();

        const imageAttachment = message.attachments.first();
        if (!imageAttachment || !imageAttachment.attachment) return await message.reply({ embeds: [embedGenerator.warning("Invalid attachment")] });

        const canvas = createCanvas(128, 128); 
        const ctx = canvas.getContext("2d");
        const img = await loadImage(imageAttachment.url);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const buffer = canvas.toBuffer();
        
        try {
            if (emoteArg) {
                const emoji = await message.guild.emojis.create({ attachment: buffer, name: name });
                await message.reply({ content: `Emote added: **${emoji.name}**` });
            }
    
            if (stickerArg) {
                const sticker = await message.guild.stickers.create({ file: buffer, name: name, tags: tag });
                await message.reply({ content: `Sticker added: **${sticker.name}**` });
            }
        } catch (err) {
            logger.error(err.stack || err);
            await message.reply({ embeds: [embedGenerator.error("An error occurred while adding the emote or sticker")] });
        }
    },
};
