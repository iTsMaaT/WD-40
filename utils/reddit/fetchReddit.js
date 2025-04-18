const logger = require("@utils/log");
const { getRedditToken, makeRequest } = require("./fetchRedditToken.js");

/**
 * Fetch a post from Reddit
 * 
 * @param {boolean} ChannelNSFW - If the channel is NSFW
 * @param {string[]} subreddits - The subreddits to fetch from
 * @param {number} limit - The number of tries to fetch a post
 * @param {string} type - The type of fetch (sub or user)
 * @param {string} postType - The type of post (image or text)
 * 
 * @returns {Promise<object>}
 */
const fetchReddit = async function(ChannelNSFW, subreddits, limit, type = "sub", postType = "image") {
    try {
        const subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
        if (!limit) limit = subreddits.length;
        let PostImage = "";
        let embed;
        let count = 0;
        const { baseUrl, headers } = await getRedditToken();
        let content;

        if (type === "sub") {
            content = await makeRequest(`${baseUrl}/r/${subreddit}/hot?limit=100`, headers);
        } else if (type === "user") {
            content = await makeRequest(`${baseUrl}/user/${subreddit}/submitted?limit=100`, headers);
        } else {
            logger.error("Wrong type");
            return {
                color: 0xff0000,
                title: "Invalid type specified",
            };
        }

        while (count <= limit) {
            const posts = content.data.children.shuffle();

            let filteredPosts;
            if (postType === "image") {
                filteredPosts = posts.filter(
                    (p) => p.data.post_hint === "image" && /\.(jpg|png|gif|jpeg)$/.test(p.data.url),
                );
            } else if (postType === "text") {
                filteredPosts = posts.filter(
                    (p) => p.data.is_self && p.data.selftext.trim() !== "",
                );
            } else {
                logger.error("Invalid postType");
                return {
                    color: 0xff0000,
                    title: "Invalid postType specified",
                };
            }

            const post = filteredPosts[Math.floor(Math.random() * filteredPosts.length)];

            if (!post) {
                count += 1;
                if (count >= limit) {
                    embed = {
                        color: 0xffff00,
                        title: `Couldn't fetch a post after **${limit}** tries`,
                    };
                    return embed;
                }
                continue;
            }

            const permalink = post.data.permalink;
            const PostURL = `https://reddit.com${permalink}`;
            const PostTitle = post.data.title;
            const PostAuthor = post.data.author;
            const PostRSlash = post.data.subreddit_name_prefixed;
            const PostNsfw = post.data.over_18;

            if (!PostNsfw || (PostNsfw && ChannelNSFW)) {
                if (postType === "image") {
                    PostImage = post.data.url;
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
                } else if (postType === "text") {
                    embed = {
                        color: 0xffffff,
                        title: PostTitle,
                        url: PostURL,
                        description: post.data.selftext,
                        footer: {
                            text: `Posted by ${PostAuthor} in ${PostRSlash}`,
                        },
                    };
                }
                return embed;
            } else {
                embed = {
                    color: 0xffff00,
                    title: "The post is NSFW but the channel isn't.",
                };
                return embed;
            }
        }
    } catch (err) {
        const embed = {
            color: 0xff0000,
            title: "Error while fetching the post",
        };
        logger.error("Error while fetching a post: " + err.stack);
        logger.info(err.response);
        return embed;
    }
};

module.exports = fetchReddit;
