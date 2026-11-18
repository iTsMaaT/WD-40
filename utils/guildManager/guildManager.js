import withDbManager from "./withDatabase/withDbGuildManager.js";
import withoutDbManager from "./withoutDatabase/withoutDbGuildManager.js";

/**
 * The guildManager module exports a manager for guild-related operations,
 * dynamically selected based on the presence of a database configuration.
 * If a `DATABASE_URL` environment variable is set, it uses the database-enabled manager;
 * otherwise, it uses a non-database manager. Additional properties and methods
 * are attached to indicate database status.
 * 
 * @module guildManager
 */
const guildManager = process.env.DATABASE_URL ? withDbManager : withoutDbManager;

export default guildManager;