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
        if (!emoteArg && !stickerArg) return await message.reply({ embeds: [embedGenerator.warning("You have to use either -e, -s, or both")] });
        if (!args[0]) return await message.reply({ embeds: [embedGenerator.warning("You have to specify a name for the emote/sticker")] });

        const tag = ":dotted_line_face:";
        const name = args[0].toString();

        const imageAttachment = message.attachments.first();
        if (!imageAttachment || !imageAttachment.attachment) return await message.reply({ embeds: [embedGenerator.warning("Invalid attachment")] });

        try {
            // Fetch image and convert to buffer
            const res = await fetch(imageAttachment.url);
            const arrayBuffer = await res.arrayBuffer();
            const imageBuffer = Buffer.from(arrayBuffer);

            // Prepare responses
            const responses = [];

            if (emoteArg) {
                // Check emote limit
                const emotes = await message.guild.emojis.fetch();
                const emoteLimit = message.guild.premiumTier === 3 ? 250 :
                    message.guild.premiumTier === 2 ? 150 :
                        message.guild.premiumTier === 1 ? 100 : 50;

                if (emotes.size >= emoteLimit) 
                    return await message.reply({ embeds: [embedGenerator.warning(`Emote limit reached. Maximum emotes allowed: ${emoteLimit}`)] });
                

                const emoteBuffer = await sharp(imageBuffer)
                    .resize(128, 128)
                    .toFormat("png")
                    .toBuffer();

                const emoji = await message.guild.emojis.create({ attachment: emoteBuffer, name: name });
                responses.push(`Emote added: **${emoji.name}**`);
            }

            if (stickerArg) {
                // Check sticker limit
                const stickers = await message.guild.stickers.fetch();
                const stickerLimit = message.guild.premiumTier === 3 ? 60 :
                    message.guild.premiumTier === 2 ? 30 :
                        message.guild.premiumTier === 1 ? 15 : 5;

                if (stickers.size >= stickerLimit) 
                    return await message.reply({ embeds: [embedGenerator.warning(`Sticker limit reached. Maximum stickers allowed: ${stickerLimit}`)] });
                

                const stickerBuffer = await sharp(imageBuffer)
                    .resize(320, 320)
                    .toFormat("png")
                    .toBuffer();

                // Ensure the file size is under 512 KB
                if (stickerBuffer.byteLength > 512 * 1024) 
                    return await message.reply({ embeds: [embedGenerator.warning("Sticker image exceeds the 512 KB limit.")] });
                

                const sticker = await message.guild.stickers.create({ file: stickerBuffer, name: name, tags: tag });
                responses.push(`Sticker added: **${sticker.name}**`);
            }

            // Send combined response
            await message.reply({ content: responses.join("\n") });
        } catch (err) {
            if (err.code === 30039) {
                await message.reply({ embeds: [embedGenerator.warning("Sticker limit reached. Remove existing stickers to add new ones.")] });
            } else if (err.code === 50046) {
                await message.reply({ embeds: [embedGenerator.warning("Emote or sticker asset is invalid. Ensure it's properly formatted.")] });
            } else {
                logger.error(err);
                await message.reply({ embeds: [embedGenerator.error("An error occurred while adding the emote or sticker")] });
            }
        }
    },
};
