const sharp = require("sharp");
const { PermissionsBitField } = require("discord.js");
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
                description: "Generate an emote. Either -e or -s has to be passed",
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

        try {
            // Resize and prepare image for emote/sticker using Sharp
            const buffer = await sharp(await fetch(imageAttachment.url).then(res => res.buffer()))
                .resize(128, 128)
                .toBuffer();

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
