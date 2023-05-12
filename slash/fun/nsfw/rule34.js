const request = require('request');
const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");

module.exports = {
    name: "rule34",
    description: "Fetches a post using the rule34.xxx API, and can accept tags",
    type :ApplicationCommandType.ChatInput,
    options: [
        {
            name: "tags",
            description: "The tags to add, seperated by spaces",
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    execute: async (logger, interaction, client) => {
        interaction.deferReply();
        const tags = interaction.options.get("tags")?.value.trim().replace(" ","+") ?? "";
        if (interaction.channel.nsfw) {
            try {
                const url = 'http://rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&tags=' + tags;
                request(url, (error, response, body) => {
                    if (!error && response.statusCode == 200) {
                        if (!body) return message.reply("An error occured, probably a invalid tag.");
                        const data = JSON.parse(body);
                        const post = data[Math.floor(Math.random() * data.length)];
                        interaction.editReply({ content: post.file_url, allowedMentions: { repliedUser: false } });
                    } else {
                        logger.error(error);
                    }

                });
            } catch (err) {
                interaction.editReply({content: "An error occured, probably a invalid tag.", ephemeral: true});
                logger.error(error);
            }
        } else {
            interaction.editReply({ content: "The channel you are in isn't NSFW", allowedMentions: { repliedUser: false } });
        }
    },
};
