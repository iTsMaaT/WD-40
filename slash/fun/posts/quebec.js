const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const FetchReddit = require("../../../utils/functions/FetchReddit.js");

module.exports = {
  name: 'quebec',
  description: 'Good luck',
  type :ApplicationCommandType.ChatInput,
  async execute(logger, interaction, client) {
    await interaction.deferReply();
    interaction.editReply({ embeds: [await FetchReddit(interaction, "quebec", "quebeclibre", "metaquebec")], allowedMentions: { repliedUser: false }})
  }
}