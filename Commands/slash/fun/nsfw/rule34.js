const got = require('got');
const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");

module.exports = {
    name: "rule34",
    description: "Fetches a post using the rule34.xxx API, and can accept tags",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "tags",
            description: "The tags to add, seperated by spaces",
            type: ApplicationCommandOptionType.String,
            required: false,
        },
    ],
    execute: async (logger, interaction, client) => {
        await interaction.deferReply();
        const tags = interaction.options.get("tags")?.value.trim().replace(" ", "+") ?? "";
        if (interaction.channel.nsfw) {
            try {
                const url = 'http://rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&tags=' + tags;
                const response = await got(url);

                const data = JSON.parse(response.body);
                const post = data[Math.floor(Math.random() * data.length)];
                interaction.editReply({ content: post.file_url, allowedMentions: { repliedUser: false } });
            } catch (err) {
                interaction.editReply({ content: "An error occured, probably a invalid tag.", ephemeral: true });
                logger.error(error);
            }
        } else {
            interaction.editRyply({ content: "The channel you are in isn't NSFW", allowedMentions: { repliedUser: false } });
        }
    },
};
