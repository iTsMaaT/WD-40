import { ApplicationCommandType, ApplicationCommandOptionType } from "discord.js";
import embedGenerator from "#utils/helpers/embedGenerator.js";
import FetchReddit from "#utils/reddit/fetchReddit.js";

export default {
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

    /**
     * @param {import("#utils/log.js")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").ChatInputCommandInteraction} interaction The interaction that triggered the command
     * @param {import("discord.js").Client} client The Discord client instance
     * @returns {Promise<void>}
     */
    async execute(logger, interaction, client) {
        const option = interaction.options.get("option").value;
        const optiondata = interaction.options.get("data").value.split(" ")[0];
        try {
            if (option == "sub") 
                await interaction.editReply({ embeds: [await FetchReddit(interaction.channel.nsfw, [optiondata], 5, "sub")] });
            else if (option == "user") 
                await interaction.editReply({ embeds: [await FetchReddit(interaction.channel.nsfw, [optiondata], 5, "user")] });
            else 
                return interaction.editReply({ embeds: [embedGenerator.warning("Wrong argument usage, please refer to `help reddit`")] });
            
        } catch (err) {
            if (err.toString().startsWith("SyntaxError: Unexpected token")) {
                logger.error("Reddit API error");
                return interaction.editReply({ embeds: [embedGenerator.error("Reddit API error, please try again later.")] });
            }
        }
    },
};
