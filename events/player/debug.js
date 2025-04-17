const config = require("@utils/config/configUtils");

module.exports = {
    name: "debug",
    once: false,
    execute(client, logger, log) {
        if (config.get("discordPlayer").logPlayerEvents) 
            logger.debug("Player event:", log);
    },
};