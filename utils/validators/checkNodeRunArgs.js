const logger = require("@utils/log");

/**
 * Checks if the proper arguments are passed to the node.js run command
 * @returns {void}
 */
const checkNodeRunArgs = async function() {
    const args = process.execArgv;
    const neededArgs = ["--openssl-legacy-provider"];
    for (const arg of neededArgs) {
        if (!args.includes(arg)) {
            logger.severe(`The following exec argument is missing: ${arg}`);
            process.exit(0);
        }
    }
};

module.exports = { execute: checkNodeRunArgs };