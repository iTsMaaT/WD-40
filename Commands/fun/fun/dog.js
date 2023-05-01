const FetchReddit = require("../../../utils/functions/FetchReddit.js");

module.exports = {
  name: 'dog',
  description: 'Not cats!',
  category: "fun",
  async execute(logger, client, message, args) {
    message.reply({ embeds: [await FetchReddit(message, "dog", "dogs", "dogpictures")], allowedMentions: { repliedUser: false }})
  }
}