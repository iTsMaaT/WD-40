const { Events } = require("discord.js");
const { DefaultDebugState } = require("@utils/config.json");

module.exports = {
    name: Events.Debug,
    once: false,
    log: false,
    async execute(client, logger, debug) {
        if (DefaultDebugState) logger.debug(debug);
    },
};