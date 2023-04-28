const Discord = require('discord.js');
const got = require('got');

module.exports = {
    name: 'furry',
    description: '[NSFW] Fetches a random post from one of three furry subreddits',
    async execute(logger, client, message, args) {
      // Define an array of subreddits to choose from
      const subreddits = ['furrypornsubreddit', 'yiff', 'furryonhuman'];
      
      // Randomly choose a subreddit from the array
      const subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
  
      try {
        var PostImage = "";
        while (!(PostImage.endsWith(".jpg") || PostImage.endsWith(".png") || PostImage.endsWith(".gif"))) {
            let response = await got(`https://www.reddit.com/r/${subreddit}/random/.json`);
            let content = JSON.parse(response.body);
            var permalink = content[0].data.children[0].data.permalink;
            var PostURL = `https://reddit.com${permalink}`;
            var PostTitle = content[0].data.children[0].data.title;
            PostImage = content[0].data.children[0].data.url;
            var PostAuthor = content[0].data.children[0].data.author;
            var PostRSlash = content[0].data.children[0].data.subreddit_name_prefixed;
        }
        const embed = {
            title: PostTitle,
            url: PostURL,
            image: {
              url: PostImage,
            },
            footer: {
              text: `Posted by ${PostAuthor} in ${PostRSlash}`,
            },
          };

        message.channel.send({ embeds: [embed], allowedMentions: { repliedUser: false } });
      } catch (error) {
        logger.error(error);
        message.reply('There was an error fetching the random post.');
      }
    },
  };

  