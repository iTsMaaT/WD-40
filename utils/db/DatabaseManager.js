const mysql = require("mysql2");
const { drizzle } = require("drizzle-orm/mysql2");

let instance;

/**
 * Class representing a Database Manager.
 */
class DatabaseManager {

    /**
     * Create a DatabaseManager instance.
     * @throws {Error} Throws an error if an instance of DatabaseManager already exists.
     */
    constructor() {
        if (instance) throw new Error("Cannot instantiate multiple DB Managers");
        instance = this;

        /**
         * The MySQL connection object.
         * @type {mysql.Connection}
         * @private
         */
        this._dbConnection = mysql.createConnection(process.env.DATABASE_URL);

        /**
         * The Drizzle ORM instance.
         * @type {drizzle}
         * @private
         */
        this._drizzle = drizzle(this._dbConnection);
    }

    /**
     * Get the Drizzle ORM instance.
     * @returns {drizzle} The Drizzle ORM instance.
     */
    get drizzle() {
        return this._drizzle;
    }
}

/**
 * The singleton instance of the DatabaseManager.
 * @type {DatabaseManager}
 */
const dbManager = new DatabaseManager();
Object.freeze(dbManager);

module.exports = dbManager;
