const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const { SendErrorEmbed } = require("@functions/discordFunctions");
const FetchReddit = require("@utils/reddit/FetchReddit.js");

module.exports = {
    name: "reddit",
    description: "Finds an image or post from *any* subreddit or user",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "option",
            description: "Choose from subreddit or user",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Lookup a user's post", value: "user" },
                { name: "Fetch a post from a subreddit", value: "sub" },
            ],
        },
        {
            name: "data",
            description: "What subreddit or user you want a post from",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    async execute(logger, interaction, client) {
        const option = interaction.options.get("option").value;
        const optiondata = interaction.options.get("data").value.split(" ")[0];
        await interaction.deferReply();
        try {
            if (option == "sub") 
                await interaction.editReply({ embeds: [await FetchReddit(interaction.channel.nsfw, [optiondata], 5, "sub")] });
            else if (option == "user") 
                await interaction.editReply({ embeds: [await FetchReddit(interaction.channel.nsfw, [optiondata], 5, "user")] });
            else 
                return SendErrorEmbed(interaction, "Wrong argument usage, please refer to `help reddit`", "yellow", true);
            
        } catch (err) {
            if (err.toString().startsWith("SyntaxError: Unexpected token")) {
                logger.error("Reddit API error");
                return SendErrorEmbed(interaction, "Reddit API error, please try again later.", "yellow", true);
            }
        }
    },
};
