const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const FetchReddit = require("../../../utils/functions/FetchReddit.js");

module.exports = {
  name: 'minecraft',
  description: 'Fetches a post from different Minecraft subreddits',
  type :ApplicationCommandType.ChatInput,
  async execute(logger, interaction, client) {
    await interaction.deferReply();
    interaction.editReply({ embeds: [await FetchReddit(interaction.channel.nsfw, "minecraftmemes", "minecraftbuilds", "mcpe", "technicalminecraft", "minecraftbedrockers")], allowedMentions: { repliedUser: false }})
  }
}