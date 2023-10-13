const { Events } = require("discord.js");

module.exports = {
    name: Events.Warn,
    once: false,
    log: true,
    execute(client, logger, info) {
        logger.warning(`Warning: ${info}`);
    },
};