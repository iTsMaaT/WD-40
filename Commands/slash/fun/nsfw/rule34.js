const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");

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
        if (!interaction.channel.nsfw) return await interaction.reply({ embeds: [embedGenerator.warning("The channel you are in isn't NSFW")]  });

        const tags = interaction.options.get("tags")?.value.trim().replace(" ", "+") ?? "";

        try {
            const url = "http://rule34.xxx/index.php?page=dapi&s=post&q=index&json=1&tags=" + tags;
            const response = await fetch(url);

            const data = await response.json();
            const post = data[Math.floor(Math.random() * data.length)];

            const RuleEmbed = embedGenerator.info({
                title: `Posted by: ${post.owner}`,
                image: {
                    url: post.file_url,
                },
                footer: {
                    text: `Score: ${post.score} | Rating: ${post.rating} | Comment count: ${post.comment_count}`,
                },
            });
            await interaction.editReply({ embeds: [RuleEmbed] });
        } catch (err) {
            await interaction.editReply({ embeds: [embedGenerator.error("An error occured, probably a invalid tag")] });
            logger.error(err);
        }
    },
};
