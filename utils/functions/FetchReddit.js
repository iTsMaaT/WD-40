const got = require("got");
//const EmbedBuilder = require("discord.js")
const FetchReddit = async function (message, AllowNSFW, ...subreddits) {
    try {
        let array = [...subreddits]
        let subreddit = array[Math.floor(Math.random() * subreddits.length)];
        console.log(subreddit)
        let PostImage = "";
        //var embed = new EmbedBuilder()
        while (!(PostImage.endsWith(".jpg") || PostImage.endsWith(".png") || PostImage.endsWith(".gif"))) {
            let response = await got(`https://www.reddit.com/r/${subreddit}/random/.json`);
            let content = JSON.parse(response.body);
            var permalink = content[0].data.children[0].data.permalink;
            var PostURL = `https://reddit.com${permalink}`;
            var PostTitle = content[0].data.children[0].data.title;
            PostImage = content[0].data.children[0].data.url;
            var PostAuthor = content[0].data.children[0].data.author;
            var PostRSlash = content[0].data.children[0].data.subreddit_name_prefixed;
            var PostNsfw = content[0].data.children[0].data.over_18;
        }

        if (!PostNsfw || (PostNsfw && message.channel.nsfw) || AllowNSFW) {
            var embed = {
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
        } else {
            embed = { title: "The post is NSFW but the channel isn't." }
        }
        return embed;
    } catch (err) {
        embed = { title: "Error while fetching the post" }
        logger.error("Error while fetching a post: " + err);
        return embed
    }
};
module.exports = FetchReddit;