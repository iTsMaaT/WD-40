const { createCanvas, loadImage } = require('canvas');
const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: 'emote',
    description: 'Makes the attachment into a server emote/sticker',
    category: 'utils',
    usage: "< -e/-s: Emote or sticker, [Name]: name of the e/s >",
    async execute(logger, client, message, args) {
        if ( !message.member.permissions.has("Administrator") || !message.author.id == process.env.OWNER_ID) SendErrorEmbed(message, "You need to be administrator to execute this command", "yellow");
        
        if (!args[1] || args[0] !== "-e" && args[0] !== "-s") return SendErrorEmbed(message, "Invalid argument", "yellow");

        const tag = ":dotted_line_face:";
        const name = args[1].toString();

        const imageAttachment = message.attachments.first();
        if (!imageAttachment || !imageAttachment.attachment) return SendErrorEmbed(message, "Invalid attachment", "yellow");

        const type = args[0];

        const canvas = createCanvas(128, 128); 
        const ctx = canvas.getContext('2d');
        const img = await loadImage(imageAttachment.url);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const buffer = canvas.toBuffer();
        
        if (type === "-e") {
            message.guild.emojis.create({attachment: buffer, name: name})
                .then(emoji => message.reply({ content: `Emote added: **${emoji.name}**` }))
                .catch((err) => {
                    SendErrorEmbed(message, "An error occured", "red");
                    logger.error(err.stack);
                });
        } else {
            message.guild.stickers.create({ file: buffer, name: name, tags: tag })
                .then(sticker => message.reply({ content: `Sticker added: **${sticker.name}**` }))
                .catch((err) => {
                    SendErrorEmbed(message, "An error occured", "red");
                    logger.error(err);
                });
        }
    }
};
