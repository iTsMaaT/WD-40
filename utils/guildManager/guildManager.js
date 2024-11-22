/**
 * The guildManager module exports a manager for guild-related operations,
 * dynamically selected based on the presence of a database configuration.
 * If a `DATABASE_URL` environment variable is set, it uses the database-enabled manager;
 * otherwise, it uses a non-database manager. Additional properties and methods
 * are attached to indicate database status.
 * 
 * @module guildManager
 */

const withDbManager = require("./withDatabase/withDbGuildManager");
const withoutDbManager = require("./withoutDatabase/withoutDbGuildManager");

/**
 * Dynamically selected guild manager based on the environment.
 * @type {object}
 */
const guildManager = process.env.DATABASE_URL ? withDbManager : withoutDbManager;

module.exports = guildManager;