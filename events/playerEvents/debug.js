const config = require("@utils/config/configUtils");

module.exports = {
    name: "debug",
    once: false,
    execute(client, logger, log) {
        if (config.get("discordPlayerConf").logEvent) logger.debug(log);
    },
};