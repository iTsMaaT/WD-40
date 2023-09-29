const got = require("got");

module.exports = {
    name: "urban",
    description: "search something on the urban dictionary",
    usage: "< [Prompt] >",
    category: "fun",
    async execute(logger, client, message, args) {

        await got(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(args.slice(0).join(" "))}`)
            .then(response => {
                try {
                    var urban = JSON.parse(response.body);
                    if (!urban.list[0]) {
                        ErrEmbed = {
                            color: 0xffff00,
                            title: `Invalid argument.`,
                            timestamp: new Date(),
                        };
                        message.reply({ embeds: [ErrEmbed] });
                        return;
                    }
                    var definition = urban.list[0].definition.replace(/[[\]]/g, "");
                    var example = urban.list[0].example.replace(/[[\]]/g, "");
                    var author = urban.list[0].author;
                    var id = urban.list[0].defid;
    
                    const UrbanEmbed = {
                        color: 0xffffff,
                        title: `Urban Dictionary:`,
                        url: urban.list[0].permalink,
                        description: `**Definition**: ${definition}\n\n**Example**: ${example}`,
                        timestamp: new Date(),
                        footer: { text: `ID : ${id} | By: ${author}` }
                    };
    
                    message.reply({ embeds: [UrbanEmbed] });
                } catch (err) {
                    const ErrEmbed = {
                        color: 0xff0000,
                        title: `Error.`,
                        description: err,
                        timestamp: new Date(),
                    };
                    message.reply({ embeds: [ErrEmbed] });
                    logger.error(err);
                }
            });
    }
};
