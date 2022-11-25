const prettyMilliseconds = require('pretty-ms');
module.exports = {
    name: "shutdown",
    description: "Shutdowns the bot from discord",
    execute(client, message, args) {
        if (message.author.id == 411996978583699456) {
            console.log("Shutdown requested from discord...");
            client.channels.cache.get("1037141235451842701").send(`Bot shutdown requested, **Uptime**: \`${prettyMilliseconds(client.uptime)}\``);
            message.channel.send(`**Shuting down the bot...**\n**Uptime**: \`${prettyMilliseconds(client.uptime)}\``).then(() => {
                client.destroy();
            })
        }
        else if (message.member.permissions.has("Administrator")) {
            message.channel.send(`Please contact the owner of this bot to execute this command (iTsMaaT#4020 or <@411996978583699456>)`);
        }
        else {
            message.channel.send(`nah`);
        }
    }
}
