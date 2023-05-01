const { EmbedBuilder } = require("discord.js");
const got = require("got");

module.exports = {
    name: "reddit",
    description: "Finds an image or post from *any* subreddit (-p for post, -u for user)",
    category: "NSFW",
    execute: async (logger, client, message, args) => {
        var sent = "";
        if (args.length == 2 && args[0] == "-p") {
            //Gore subreddits blacklist
            if (args[1] != "eyeblech" && args[1] != "gore" && args[1] != "guro") {
                let RedditImage = "";
                var RedditTries = 1;
                sent = await message.channel.send({ content: `Attempt ${RedditTries}/10`, fetchreply: true })
                //Tries to fetch a post 10 times
                for (let i = 0; i <= 10; i++) {
                    try {
                        let response = await got(`https://www.reddit.com/r/${args[1]}/random/.json`);
                        let content = JSON.parse(response.body);
                        let permalink = content[0].data.children[0].data.permalink;
                        let RedditURL = `https://reddit.com${permalink}`;
                        let RedditTitle = content[0].data.children[0].data.title;
                        let PostNsfw = content[0].data.children[0].data.over_18;
                        RedditImage = content[0].data.children[0].data.url;
                        RedditTries += 1;
                        //Updates the counter
                        if (RedditTries % 2 == 0 && RedditTries <= 10) {
                            sent.edit({ content: `Attempt ${RedditTries}/10`, fetchreply: true })
                        }
                        if (RedditImage.endsWith(".jpg") || RedditImage.endsWith(".png") || RedditImage.endsWith(".gif")) {
                            if (!PostNsfw || (PostNsfw && message.channel.nsfw)) {

                                const embed = {
                                    title: RedditTitle,
                                    url: RedditURL,
                                    image: {
                                      url: RedditImage,
                                    },
                                    footer: {
                                      text: `Posted by ${content[0].data.children[0].data.author} in ${content[0].data.children[0].data.subreddit_name_prefixed}`,
                                    },
                                  };


                                sent.edit({ content: `Attempt ${RedditTries}/10`, fetchreply: true })
                                sent.edit({ embeds: [embed], allowedMentions: { repliedUser: false } });
                                logger.info(RedditImage);
                                return;
                            } else {
                                return sent.edit(`The post is NSFW but the channel isn't`);
                            }
                        }
                    } catch (err) {
                        //Catches the error, probably a non-existent or banned subreddit
                        sent.edit(`Non-existent Subreddit\n\`${err}\``);
                        logger.error(`Non-existent Subreddit\n\`${err.stack}\``);
                        return;
                    }
                }
                sent.edit("Could not find post containing a picture or compatible gif link (10 tries)");
            } else {
                message.reply("No.");
            }
        } else if (args.length == 2 && args[0] == "-u") {
            const url = `https://www.reddit.com/user/${args[1]}/submitted.json`;
            let response;
            try {
              response = await got(url);
            } catch (error) {
              console.error(error);
              return message.reply('an error occurred while fetching posts from the Reddit API.');
            }
        
            // Parse the JSON response
            const data = JSON.parse(response.body);
        
            // Filter the posts to only include image posts
            const imagePosts = data.data.children.filter((post) => post.data.post_hint === 'image');
        
            // Select a random post from the image posts
            const randomPost = imagePosts[Math.floor(Math.random() * imagePosts.length)];
        
            // If no image posts were found, return an error message
            if (!randomPost) {
              return message.reply(`no image posts found for user "${args[0]}".`);
            }
        
            // Send the post as an embed in the channel
            const embed = {
              title: randomPost.data.title,
              url: `https://www.reddit.com${randomPost.data.permalink}`,
              image: {
                url: randomPost.data.url,
              },
              footer: {
                text: `Posted by ${randomPost.data.author} in ${randomPost.data.subreddit_name_prefixed}`,
              },
            };
            message.channel.send({ embeds: [embed] });
          
        } else {
            message.reply({ content: "You didn't specify the parameter correctly (-p for post, -u for user : >reddit <parameter> <subreddit or user>)", allowedMentions: { repliedUser: false } });
        }
    }
}
