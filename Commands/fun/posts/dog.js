const FetchReddit = require("../../../utils/functions/FetchReddit.js");

module.exports = {
  name: 'dog',
  description: 'Not cats!',
  category: "posts",
  async execute(logger, client, message, args) {
    message.channel.sendTyping();
    message.reply({ embeds: [await FetchReddit(message.channel.nsfw, "dog", "dogs", "dogpictures")], allowedMentions: { repliedUser: false }})
  }
}