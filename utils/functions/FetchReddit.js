const got = require("got");

const FetchReddit = async function (ChannelNSFW, ...subreddits) {
    try {
        const subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
        let PostImage = "";
        let embed;

        while (!/\.(jpg|png|gif)$/.test(PostImage)) {
            const response = await got(`https://www.reddit.com/r/${subreddit}/random/.json`, { agent: false });
            const content = JSON.parse(response.body);
            const permalink = content[0].data.children[0].data.permalink;
            const PostURL = `https://reddit.com${permalink}`;
            const PostTitle = content[0].data.children[0].data.title;
            PostImage = content[0].data.children[0].data.url;
            const PostAuthor = content[0].data.children[0].data.author;
            const PostRSlash = content[0].data.children[0].data.subreddit_name_prefixed;
            const PostNsfw = content[0].data.children[0].data.over_18;

            if (!PostNsfw || (PostNsfw && ChannelNSFW)) {
                embed = {
                    color: 0xffffff,
                    title: PostTitle,
                    url: PostURL,
                    image: {
                        url: PostImage,
                    },
                    footer: {
                        text: `Posted by ${PostAuthor} in ${PostRSlash}`,
                    },
                };
                console.log(PostImage);
            } else {
                embed = {
                    color: 0xffff00,
                    title: "The post is NSFW but the channel isn't.",
                };
            }
        }
        
        return embed;
    } catch (err) {
        const embed = {
            color: 0xff0000,
            title: "Error while fetching the post",
        };
        logger.error("Error while fetching a post: " + err);
        return embed;
    }
};

module.exports = FetchReddit;
