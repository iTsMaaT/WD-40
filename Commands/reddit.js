const { EmbedBuilder } = require("discord.js");
const got = require("got");

module.exports = {
    name: "reddit",
    desciption: "Finds an image or post from any subreddit",
    execute: async (client, message, args) => {
        if (args.length == 1) {
            if (args[0] != "eyeblech" && args[0] != "gore" && args[0] != "guro") {
                let RedditImage = "";
                var RedditTries = 1;
                const sent = await message.channel.send({content: `Attempt ${RedditTries}/10`, fetchreply: true})
                const embed = new EmbedBuilder();
                for (let i = 0; i <= 10; i++) {
                    try {
                        let response = await got(`https://www.reddit.com/r/${args[0]}/random/.json`);
                        let content = JSON.parse(response.body);
                        let permalink = content[0].data.children[0].data.permalink;
                        let RedditURL = `https://reddit.com${permalink}`;
                        let RedditTitle = content[0].data.children[0].data.title;
                        RedditImage = content[0].data.children[0].data.url;
                        RedditTries += 1;
                        if (RedditTries % 2 == 0 && RedditTries <= 10) {
                        sent.edit({content: `Attempt ${RedditTries}/10`, fetchreply: true})
                        }
                        if (RedditImage.startsWith("https://i.redd.it") || RedditImage.startsWith("https://im4.ezgif.com") || RedditImage.endsWith(".gif")) {
                            embed.setImage(RedditImage);
                            embed.setTitle(`${RedditTitle}`);
                            embed.setURL(`${RedditURL}`);
                            sent.edit({content: `Attempt ${RedditTries}/10`, fetchreply: true})
                            sent.edit({ embeds: [embed], allowedMentions: { repliedUser: false } });
                            console.log(RedditImage);
                            return;
                        }
                    } catch (err) {
                        sent.edit(`Non-existent Subreddit\n\`${err}\``);
                        return;
                    }
                }
                sent.edit("Could not find post containing a picture or compatible gif link (10 tries)");
            } else {
                message.reply("No.");
            }
        }
    }  //!RedditImage.startsWith("https://i.redd.it")
}
