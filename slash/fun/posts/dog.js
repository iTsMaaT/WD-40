const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const FetchReddit = require("../../../utils/functions/FetchReddit.js");

module.exports = {
    name: 'dog',
    description: 'Not cats!',
    type :ApplicationCommandType.ChatInput,
    async execute(logger, interaction, client) {
        await interaction.deferReply();
        interaction.editReply({ embeds: [await FetchReddit(interaction.channel.nsfw, "dog", "dogs", "dogpictures")], allowedMentions: { repliedUser: false }});
    }
};