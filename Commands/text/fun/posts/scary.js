const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "scary",
    description: "Good luck",
    category: "posts",
    aliases: ["twosentencehorror"],
    async execute(logger, client, message, args, found) {
        let RedditDesc, RedditTitle, tries;

        while (!RedditDesc) {
            const response = await fetch("https://www.reddit.com/r/2sentence2horror/random/.json");
            const content = await response.json();
            RedditTitle = content[0].data.children[0].data.title || "";
            RedditDesc = content[0].data.children[0].data.selftext || "";
            tries++;
            if (tries > 20) return SendErrorEmbed(message, "Failed to find post after 20 tries.", "red");
        }

        const embed = {
            title: RedditTitle,
            description: RedditDesc,
            color: 0x6b8a70,
            timestamp: new Date(),
        };

        message.reply({ embeds: [embed] });
    },
};