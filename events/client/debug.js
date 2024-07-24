/* eslint-disable no-extra-boolean-cast */
const { Events } = require("discord.js");

module.exports = {
    name: Events.Debug,
    once: false,
    log: false,
    async execute(client, logger, debug) {
        if (process.env.CURRENT_DEBUG_STATE == "1") logger.debug(debug);
    },
};