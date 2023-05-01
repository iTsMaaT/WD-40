const FetchReddit = require("../../../utils/functions/FetchReddit.js");

module.exports = {
  name: 'minecraft',
  description: 'Fetches a post from different Minecraft subreddits',
  category: "fun",
  async execute(logger, client, message, args) {
    message.reply({ embeds: [await FetchReddit(message, "minecraftmemes", "minecraftbuilds", "mcpe", "technicalminecraft", "minecraftbedrockers")], allowedMentions: { repliedUser: false }})
  }
}