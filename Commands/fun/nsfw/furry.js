const Discord = require('discord.js');
const got = require('got');
const FetchReddit = require("../../../utils/functions/FetchReddit.js");

module.exports = {
  name: 'furry',
  description: 'Fetches a random post from one of three furry subreddits UwU',
  category: "NSFW",
  async execute(logger, client, message, args) {
    message.reply({ embeds: [await FetchReddit(message, "furrypornsubreddit", "yiff", "furryonhuman")], allowedMentions: { repliedUser: false }})
  }
}

