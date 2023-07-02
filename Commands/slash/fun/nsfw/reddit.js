const { ApplicationCommandType, ApplicationCommandOptionType } = require("discord.js");
const got = require("got");

module.exports = {
    name: "reddit",
    description: "Finds an image or post from *any* subreddit or user",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "option",
            description: "Choose from subreddit or user",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Lookup a user's post", value: "user", },
                { name: "Fetch a post from a subreddit", value: "sub", },
            ],
        },
        {
            name: "data",
            description: "What subreddit or user you want a post from",
            type: ApplicationCommandOptionType.String,
            required: true,
        },
    ],
    execute: async (logger, interaction, client) => {
        const option = interaction.options.get("option").value;
        const optiondata = interaction.options.get("data").value;
        await interaction.deferReply();
        switch (option) {
        case "sub":
            var sent = "";
            //Gore subreddits blacklist
            if (optiondata != "eyeblech" && optiondata != "gore" && optiondata != "guro") {
                let RedditImage = "";
                var RedditTries = 1;
                sent = await interaction.editReply({ content: `Attempt ${RedditTries}/10`, fetchreply: true });
                //Tries to fetch a post 10 times
                for (let i = 0; i <= 10; i++) {
                    try {
                        const response = await got(`https://www.reddit.com/r/${optiondata}/random/.json`);
                        const content = JSON.parse(response.body);
                        const permalink = content[0].data.children[0].data.permalink;
                        const RedditURL = `https://reddit.com${permalink}`;
                        const RedditTitle = content[0].data.children[0].data.title;
                        const PostNsfw = content[0].data.children[0].data.over_18;
                        RedditImage = content[0].data.children[0].data.url;
                        RedditTries += 1;
                        //Updates the counter
                        if (RedditTries % 2 == 0 && RedditTries <= 10) {
                            sent.edit({ content: `Attempt ${RedditTries}/10`, fetchreply: true });
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


                                sent.edit({ content: `Attempt ${RedditTries}/10`, fetchreply: true });
                                sent.edit({ embeds: [embed]  });
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
            }
            break;
      
        case "user": {
            const url = `https://www.reddit.com/user/${optiondata}/submitted.json`;
            let response;
            try {
                response = await got(url);
            } catch (error) {
                console.error(error);
                return interaction.reply({ content: 'an error occurred while fetching posts from the Reddit API.', ephemeral: true });
            }

            // Parse the JSON response
            const data = JSON.parse(response.body);

            // Filter the posts to only include image posts
            const imagePosts = data.data.children.filter((post) => post.data.post_hint === 'image');

            // Select a random post from the image posts
            const randomPost = imagePosts[Math.floor(Math.random() * imagePosts.length)];

            // If no image posts were found, return an error message
            if (!randomPost) {
                return interaction.editReply({ content: `no image posts found for user "${data}".`, ephemeral: true });
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
            interaction.editReply({ embeds: [embed]  });
        }
        } 
    }
};
