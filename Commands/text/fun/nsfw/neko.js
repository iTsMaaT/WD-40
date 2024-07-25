const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "neko",
    description: "meow mrrrr~~ ฅ(＾・ω・＾ฅ)",
    category: "NSFW",
    async execute(logger, client, message, args, optionalArgs) {
        if (!message.channel.nsfw) return await message.reply({ embeds: [embedGenerator.error("This command is only available in NSFW channels")] });
        const url = await (await fetch("https://nekos.life/api/neko")).json();
        
        const embed = embedGenerator.info({
            title: "Enjoy!",
            image: {
                url: url.neko,
            },
        }).withAuthor(message.author);

        message.reply({ embeds: [embed] });
    },
};
