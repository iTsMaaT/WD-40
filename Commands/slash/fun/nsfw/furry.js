const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const FetchReddit = require("../../../../utils/functions/FetchReddit.js");

module.exports = {
    name: 'furry',
    description: 'Fetches a random post from one of three furry subreddits UwU',
    type :ApplicationCommandType.ChatInput,
    async execute(logger, interaction, client) {
        interaction.reply({ embeds: [await FetchReddit(interaction.channel.nsfw, "furrypornsubreddit", "yiff", "furryonhuman")] });
    }
};

