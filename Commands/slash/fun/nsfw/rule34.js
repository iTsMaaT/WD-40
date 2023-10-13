const got = require("got");
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
                const url = "http://rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&tags=" + tags;
                const response = await got(url);

                const data = JSON.parse(response.body);
                const post = data[Math.floor(Math.random() * data.length)];

                const RuleEmbed = {
                    color: 0xffffff,
                    title: `Posted by: ${post.owner}`,
                    image: {
                        url: post.file_url,
                    },
                    timestamp: new Date(),
                };
                interaction.reply({ embeds: [RuleEmbed] });
            } catch (err) {
                const RuleEmbed = {
                    color: 0xff0000,
                    title: "An error occured, probably a invalid tag",
                    timestamp: new Date(),
                };
                interaction.reply({ embeds: [RuleEmbed] });
                logger.error(err);
            }
        } else {
            interaction.editRyply({ content: "The channel you are in isn't NSFW"  });
        }
    },
};
