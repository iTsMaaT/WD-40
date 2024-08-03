const embedGenerator = require("@utils/helpers/embedGenerator");
const { getRedditToken, makeRequest } = require("@root/utils/reddit/fetchRedditToken.js");
const axios = require("axios");

module.exports = {
    name: "scary",
    description: "Good luck",
    category: "posts",
    aliases: ["twosentencehorror"],
    async execute(logger, client, message, args, optionalArgs) {
        let RedditDesc, RedditTitle, tries;

        const { baseUrl, headers } = await getRedditToken();
        while (!RedditDesc) {
            const content = await makeRequest(`${baseUrl}/r/2sentence2horror/random/.json`, headers);
            RedditTitle = content[0].data.children[0].data.title || "";
            RedditDesc = content[0].data.children[0].data.selftext || "";
            tries++;
            if (tries > 20) return await message.reply({ embeds: [embedGenerator.error("Failed to find post after 20 tries.")] });
        }

        const embed = embedGenerator.info({
            title: RedditTitle,
            description: RedditDesc,
            color: 0x6b8a70,
        }).withAuthor(message.author);

        message.reply({ embeds: [embed] });
    },
};