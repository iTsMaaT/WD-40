const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const FetchReddit = require("../../../../utils/functions/FetchReddit.js");

module.exports = {
    name: 'meme',
    description: 'Fetches a random post from a random shitpost sub (I hate meme subs)',
    type :ApplicationCommandType.ChatInput,
    async execute(logger, interaction, client) {
        await interaction.deferReply();
        interaction.editReply({ embeds: [await FetchReddit(interaction.channel.nsfw, "shitposting", "doodoofard", "okmatecrosseur", "poltical", "shid_and_camed", "the_pack", "whenthe", "wordington", "dankmemes")] });
    }
};