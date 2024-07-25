const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "wikihow",
    description: "Gives a random image from wikihow",
    category: "fun",
    async execute(logger, client, message, args, optionalArgs) {

        try {
            const wikihowImage = await (await fetch("https://www.wikihow.com/api.php?action=query&generator=random&prop=imageinfo&format=json&iiprop=url&grnnamespace=6", { https: { rejectUnauthorized: false } })).json();
            const image = wikihowImage.query.pages[Object.keys(wikihowImage.query.pages)[0]].imageinfo[0].url;
            
            const Embed = embedGenerator.info({
                title: "Random Wikihow image",
                image: {
                    url: image,
                },
            }).withAuthor(message.author);
    
            message.reply({ embeds: [Embed] });
        } catch (err) {
            return await message.reply({ embeds: [embedGenerator.error("An error occured")] });
        }
    },
};