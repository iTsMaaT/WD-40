const got = require("got");
const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "reddit",
    description: "Finds an image or post from *any* subreddit",
    usage: "< -p [...]: post, -u [...]: user>",
    category: "fun",
    examples: ["-p aww", "-u spez"],
    execute: async (logger, client, message, args) => {
        let sent = "";
        
        if (args.length == 2 && args[0] == "-p") {
            //Gore subreddits blacklist
            if (args[1] != "eyeblech" && args[1] != "gore" && args[1] != "guro") {
                let RedditImage = "";
                var RedditTries = 1;
                sent = await message.reply({ content: `Attempt ${RedditTries}/10`});
                //Tries to fetch a post 10 times
                for (let i = 0; i <= 10; i++) {
                    try {
                        const response = await got(`https://www.reddit.com/r/${args[1]}/random/.json`);
                        const content = JSON.parse(response.body);
                        const permalink = content[0].data.children[0].data.permalink;
                        const RedditURL = `https://reddit.com${permalink}`;
                        const RedditTitle = content[0].data.children[0].data.title;
                        const PostNsfw = content[0].data.children[0].data.over_18;
                        RedditImage = content[0].data.children[0].data.url;
                        RedditTries += 1;
                        //Updates the counter
                        if (RedditTries % 2 == 0 && RedditTries <= 10) {
                            sent.edit({ content: `Attempt ${RedditTries}/10`});
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


                                sent.edit({ content: `Attempt ${RedditTries}/10`, embeds: [embed]});
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
                return SendErrorEmbed(message, "An error occurred while fetching posts from the Reddit API.", "yellow");
            }
        
            // Parse the JSON response
            const data = JSON.parse(response.body);
        
            // Filter the posts to only include image posts
            const imagePosts = data.data.children.filter((post) => post.data.post_hint === 'image');
        
            // Select a random post from the image posts
            const randomPost = imagePosts[Math.floor(Math.random() * imagePosts.length)];
        
            // If no image posts were found, return an error message
            if (!randomPost) {
                return SendErrorEmbed(message, `no image posts found for user "${args[0]}".`, "yellow");
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
            return SendErrorEmbed(message, "Wrong argument usage, please refer to `>help reddit`", "yellow");
        }
    }
};
