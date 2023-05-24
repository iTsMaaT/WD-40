const got = require("got")
module.exports = {
    name: "urban",
    description: "le funny",
    category: "fun",
    async execute(logger, client, message, args) {
        message.channel.sendTyping();

        await got(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(args.slice(0).join(" "))}`)
        .then(response => {
            try {
                var urban = JSON.parse(response.body);
                if (!urban.list[0]) {
                    ErrEmbed = {
                        color: 0xffff00,
                        title: `Invalid argument.`,
                        timestamp: new Date(),
                    }
                    message.reply({ embeds: [ErrEmbed], allowedMentions: { repliedUser: false }});
                    return;
                }
                var definition = urban.list[0].definition.replace(/[\[\]]/g, "")
                var example = urban.list[0].example.replace(/[\[\]]/g, "");
                var author = urban.list[0].author;
    
                UrbanEmbed = {
                    color: 0xffffff,
                    title: `Urban Dictionary:`,
                    url: urban.list[0].permalink,
                    description: `**Definition**: ${definition}\n\n**Example**: ${example}`,
                    timestamp: new Date(),
                    footer: { text: `ID : By: ${author}` }
                }
    
                message.reply({ embeds: [UrbanEmbed], allowedMentions: { repliedUser: false }});
            } catch (err) {
                ErrEmbed = {
                    color: 0xff0000,
                    title: `Error.`,
                    description: err,
                    timestamp: new Date(),
                }
                message.reply({ embeds: [ErrEmbed], allowedMentions: { repliedUser: false }});
                logger.error(err);
            }
        })
    }
}
