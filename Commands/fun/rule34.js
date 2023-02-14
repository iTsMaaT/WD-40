const got = require("got");
module.exports = {
    name: "rule34",
    description: " [NSFW] You know what this is",
    category: "fun",
    execute: async (logger, client, message, args) => {
        switch (Math.floor(Math.random() * 5 + 1)) {
            case 1:
                var RuleLink = "https://www.reddit.com/r/rule34/random/.json";
                break;
            case 2:
                var RuleLink = "https://www.reddit.com/r/rule34lol/random/.json";
                break;
            case 3:
                var RuleLink = "https://www.reddit.com/r/rule34rainbowsix/random/.json";
                break;
            case 4:
                var RuleLink = "https://www.reddit.com/r/rule34feet/random/.json";
                break;
            case 5:
                var RuleLink = "https://www.reddit.com/r/2booty/random/.json";
                break;
        }
        try {
            let RuleImage = "";
            while (!RuleImage.startsWith("https://i.redd.it")) {
                let response = await got(RuleLink);
                let content = JSON.parse(response.body);
                let permalink = content[0].data.children[0].data.permalink;
                var RulePostUrl = `https://reddit.com${permalink}`;
                RuleImage = content[0].data.children[0].data.url;
            }
            message.reply({
                content: `NSFW Ahead: ||<${RulePostUrl}>||`,
                files: [{
                    attachment: RuleImage,
                    name: `SPOILER_FILE.jpg`
                }]
            });
        }
        catch (err) {
            try {
                while (!RuleImage.startsWith("https://i.redd.it")) {
                    let response = await got("https://www.reddit.com/r/rule34/random/.json");
                    let content = JSON.parse(response.body);
                    let permalink = content[0].data.children[0].data.permalink;
                    var RulePostUrl = `https://reddit.com${permalink}`;
                    RuleImage = content[0].data.children[0].data.url;
                }
                message.reply({
                    content: `NSFW Ahead: ||<${RulePostUrl}>||`,
                    files: [{
                        attachment: RuleImage,
                        name: `SPOILER_FILE.jpg`
                    }]
                });
                logger.error(err);
            }
            catch (err) {
                message.reply(`Error while making the file as spoiler, please try again.\n\`${err}\``)
                logger.error(err);
            }
        }
    }
}