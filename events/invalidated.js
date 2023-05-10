const { Events } = require('discord.js');

module.exports = {
	name: Events.Invalidated,
	once: false,
	execute(client, logger) {
        logger.severe("The client was invalidated, restarting the bot...");
        client.channels.cache.get("1037141235451842701").send(`Restarting the bot : Invalidated. <@411996978583699456>`);
        setTimeout(function () {
            global.prisma.$disconnect();
            process.exit(1);
        }, 1000 * 3)
	},
};