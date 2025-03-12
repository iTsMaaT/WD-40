const DB = require('../../utils/db/databaseManager.js');
module.exports = {
    name: "SIGINT",
    async execute(client, logger, err) {
        DB.close();
        process.exit(1);
    },
};