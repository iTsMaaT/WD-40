const FetchReddit = require("../../../utils/functions/FetchReddit.js");

module.exports = {
  name: 'quebec',
  description: 'Good luck',
  category: "posts",
  async execute(logger, client, message, args) {
    message.reply({ embeds: [await FetchReddit(message, "quebec", "quebeclibre", "metaquebec")], allowedMentions: { repliedUser: false }})
  }
}