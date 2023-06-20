const got = require("got");
module.exports = {
    name: "wikihow",
    description: "Gives a random image from wikihow",
    category: "fun",
    async execute(logger, client, message, args) {
        message.channel.sendTyping();

        const req = await got("https://www.wikihow.com/api.php?action=query&generator=random&prop=imageinfo&format=json&iiprop=url&grnnamespace=6", { https: { rejectUnauthorized: false } });
        const json = await JSON.parse(req.body);
        const id = Object.keys(json.query.pages)[0];
        const image = json.query.pages[id].imageinfo[0].url;

        const Embed = {
            color: 0xffffff,
            title: `Random Wikihow image`,
            image: {
                url: image,
            },
            timestamp: new Date(),
        };

        message.reply({ embeds: [Embed], allowedMentions: { repliedUser: false } });
    }
};