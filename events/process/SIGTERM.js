const DB = require('../../utils/db/databaseManager.js');
module.exports = {
    name: "SIGTERM",
    async execute(client, logger, err) {
        logger.event("SIGTERM signal caught:");
        logger.severe(err);
        DB.close();
        process.exit(1);
    },
};