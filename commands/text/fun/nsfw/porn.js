const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "porn",
    description: "pornography",
    category: "NSFW",
    async execute(logger, client, message, args, optionalArgs) {
        if (!message.channel.nsfw) return await message.reply({ embeds: [embedGenerator.error("This command is only available in NSFW channels")] });
        const url = await (await fetch("https://nekobot.xyz/api/image?type=pgif")).json();
        
        const embed = embedGenerator.info({
            title: "Enjoy!",
            image: {
                url: url.message,
            },
        }).withAuthor(message.author);

        message.reply({ embeds: [embed] });
    },
};