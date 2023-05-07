const FetchReddit = require("../../../utils/functions/FetchReddit.js");

module.exports = {
  name: 'cat',
  description: 'Cats!',
  category: "posts",
  async execute(logger, client, message, args) {
    message.reply({ embeds: [await FetchReddit(message, "cat", "cats", "catswithjobs", "tightpussy", "backpussy", "whitepussy", "illegalysmolcats")], allowedMentions: { repliedUser: false }})
  }
}