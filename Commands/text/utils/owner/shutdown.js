const prettyMilliseconds = require('pretty-ms');
module.exports = {
    name: "shutdown",
    category: "utils",
    description: "Shutdowns the bot from discord",
    private: true,
    execute(logger, client, message, args) {
        const server = process.env.SERVER;
        if (message.author.id == 411996978583699456) {
            logger.severe("Shutdown requested from discord...");
            client.channels.cache.get("1037141235451842701").send(`Bot shutdown requested, **Uptime**: \`${prettyMilliseconds(client.uptime)}\``);
            message.channel.send(`**Shutting down the bot...**\n**Uptime**: \`${prettyMilliseconds(client.uptime)}\``).then(() => {
                //Destroys the client, disconnects the database and exits the process
                client.destroy();
                global.prisma.$disconnect();
                process.exit(0);
            });
            return;
        }

        if (message.author.id == 411996978583699456 && (args[0] == server)) {
            client.channels.cache.get("1037141235451842701").send(`Bot shutdown requested on \`${server}\`, **Uptime**: \`${prettyMilliseconds(client.uptime)}\``);
            message.channel.send(`**Shutting down the bot on the \`${server}\` server...**\n**Uptime**: \`${prettyMilliseconds(client.uptime)}\``).then(() => {

                client.destroy();
                global.prisma.$disconnect();
                process.exit(0);
            });
            return;
        }
    }
};
