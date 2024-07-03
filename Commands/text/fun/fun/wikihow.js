const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "wikihow",
    description: "Gives a random image from wikihow",
    category: "fun",
    async execute(logger, client, message, args, optionalArgs) {

        try {
            const req = await fetch("https://www.wikihow.com/api.php?action=query&generator=random&prop=imageinfo&format=json&iiprop=url&grnnamespace=6", { https: { rejectUnauthorized: false } });
            const json = await req.json();
            const id = Object.keys(json.query.pages)[0];
            const image = json.query.pages[id].imageinfo[0].url;
            
            const Embed = {
                color: 0xffffff,
                title: "Random Wikihow image",
                image: {
                    url: image,
                },
                timestamp: new Date(),
            };
    
            message.reply({ embeds: [Embed] });
        } catch (err) {
            return SendErrorEmbed(message, "Coulsn't fetch the image", "red");
        }
    },
};