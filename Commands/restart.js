const prettyMilliseconds = require('pretty-ms');
module.exports = {
    name: "restart",
    description: "restart the bot from discord (intentionally crashes)",
    execute(logger, client, message, args) {
        if (message.author.id == 411996978583699456) {
            logger.severe("Restart requested from discord...");
            logger.severe("Bot crash incoming");
            client.channels.cache.get("1037141235451842701").send("Restart requested from discord...");
            
            setTimeout(function () {
            /****************/
            client.channels.cache.get().send();
            /****************/
            }, 1000 * 1)
        }
        else if (message.member.permissions.has("Administrator")) {
            message.channel.send(`Please contact the owner of this bot to execute this command (iTsMaaT#4020 or <@411996978583699456>)`);
        }
        else {
            message.channel.send(`nah`);
        }
    }
}