const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const FetchReddit = require("../../../utils/functions/FetchReddit.js");

module.exports = {
  name: 'cat',
  description: 'Cats!',
  type :ApplicationCommandType.ChatInput,
  async execute(logger, interaction, client) {
    await interaction.deferReply();
    interaction.editReply({ embeds: [await FetchReddit(interaction, "cat", "cats", "catswithjobs", "tightpussy", "backpussy", "whitepussy", "illegallysmolcats")], allowedMentions: { repliedUser: false }})
  }
}