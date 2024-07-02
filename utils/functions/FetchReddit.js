const logger = require("@root/index.js");
const { getRedditToken } = require("../reddit/fetchRedditToken.js");
const axios = require("axios");

const FetchReddit = async function(ChannelNSFW, subreddits, limit, type = "sub") {
    try {
        const subreddit = subreddits[Math.floor(Math.random() * subreddits.length)];
        if (!limit) limit = subreddit.length;
        let PostImage = "";
        let embed;
        console.log(subreddit);
        let count = 0;
        const { baseUrl, headers } = await getRedditToken();
        while (!/\.(jpg|png|gif|jpeg)$/.test(PostImage)) {
            let content;
            if (type == "sub") 
                content = await makeRequest(`${baseUrl}/r/${subreddit}/random/.json`, headers);
            else if (type == "user") 
                content = [await makeRequest(`${baseUrl}/user/${subreddit}/submitted.json`, headers)];
            else  
                logger.error("Wrong type");
            
            console.log(content);
            const post = content[0].data.children.filter((p) => p.data.post_hint === "image" && /\.(jpg|png|gif|jpeg)$/.test(p.data.url))[0];
            if (post == undefined || post.length == 0) {
                count += 1;
                if (count == limit) {
                    embed = {
                        color: 0xffff00,
                        title: `Couldn't fetch post after **${limit}** tries`,
                    };
                    return embed;
                }
                continue;
            }
            console.log(post);
            const permalink = post.data.permalink;
            const PostURL = `https://reddit.com${permalink}`;
            const PostTitle = post.data.title;
            PostImage = post.data.url;
            const PostAuthor = post.data.author;
            const PostRSlash = post.data.subreddit_name_prefixed;
            const PostNsfw = post.data.over_18;

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
        logger.error("Error while fetching a post: " + err.stack);
        logger.info(err.response);
        return embed;
    }
};

module.exports = FetchReddit;


async function makeRequest(url, headers, attempt = 0) {
    const response = await axios.request({
        method: "GET",
        url,
        headers: headers,
        maxBodyLength: Infinity,
        maxRedirects: 0,
        validateStatus: (code) => (code >= 200 && code < 300) || code == 302,
    });
    if (response.status == 302) {
        if (attempt > 3) 
            throw new Error("Too many redirect");
        
        const newUrl = response.headers.location.split("/");
        newUrl[newUrl.length - 2] = encodeURIComponent(newUrl[newUrl.length - 2]);
        const newHeaders = Object.keys(headers).filter(n => n.toLowerCase() != "authorization").reduce((prev, curr) => prev[curr] = headers[curr], {});
        return await makeRequest(newUrl.join("/"), newHeaders, attempt + 1);
    }
    
    return response.data;
}