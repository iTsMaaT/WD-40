const logger = require("@root/index.js");

const FetchReddit = async function(ChannelNSFW, subreddits, limit) {
    try {
        const subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
        if (!limit) limit = subreddit.length;
        let PostImage = "";
        let embed;
        console.log(subreddit);
        const count = 0;
        while (!/\.(jpg|png|gif|jpeg)$/.test(PostImage)) {
            const response = await fetch(`https://www.reddit.com/r/${subreddit}/random/.json`, { agent: false });
            const content = await response.json();
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
            limit += 1;
            if (count == limit) {
                embed = {
                    color: 0xffff00,
                    title: `Couldn't fetch post after **${limit}** tries`,
                };
                return embed;
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
