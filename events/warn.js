const { Events } = require('discord.js');

module.exports = {
    name: Events.Warn,
    once: false,
    execute(client, logger, info) {
        logger.warning(`Warning: ${info}`);
    },
};