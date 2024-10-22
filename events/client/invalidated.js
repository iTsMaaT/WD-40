const { Events } = require("discord.js");

module.exports = {
    name: Events.Invalidated,
    once: false,
    log: true,
    execute(client, logger) {
        logger.severe("The client was invalidated, restarting the bot...");
        client.channels.cache.get(process.env.STATUS_CHANNEL_ID).send("Restarting the bot : Invalidated.");
        setTimeout(function() {
            process.exit(1);
        }, 1000 * 3);   
    },
};