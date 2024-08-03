const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "capybara",
    description: "Cute but not cute according to chatGPT",
    category: "posts",
    async execute(logger, client, message, args, optionalArgs) {
        const image = await (await fetch("https://api.capy.lol/v1/capybara?json=true")).json();
        const embed = embedGenerator.info({
            title: "Random capybara",
            image: {
                url: image.data.url,
            },
        }).withAuthor(message.author);
        await message.reply({ embeds: [embed] });
    },
};