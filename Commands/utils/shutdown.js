const prettyMilliseconds = require('pretty-ms');
module.exports = {
    name: "shutdown",
    category: "utils",
    description: "Shutdowns the bot from discord",
    private: true,
    execute(logger, client, message, args) {
        if (message.author.id == 411996978583699456) {
            logger.severe("Shutdown requested from discord...");
            client.channels.cache.get("1037141235451842701").send(`Bot shutdown requested, **Uptime**: \`${prettyMilliseconds(client.uptime)}\``);
            message.channel.send(`**Shuting down the bot...**\n**Uptime**: \`${prettyMilliseconds(client.uptime)}\``).then(() => {
                //Destroys the client, disconnects the database and exits the process
                client.destroy();
                global.prisma.$disconnect();
                process.exit(0);
            })
        }
        else if (message.member.permissions.has("Administrator")) {
            //If a admin executes the command, tells it to contact iTsMaat
            message.channel.send(`Please contact the owner of this bot to execute this command (iTsMaaT#4020 or <@411996978583699456>)`);
        }
        else {
            //Doesn't let normal users execute the command
            message.channel.send(`nah`);
        }
    }
}
