const mysql = require("mysql2/promise"); // Switch to the promise-based API
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

        if (!this.dbExists()) return;
          
        /**
         * The MySQL connection pool.
         * @type {mysql.Pool}
         * @private
         */
        this._dbPool = mysql.createPool({
            uri: process.env.DATABASE_URL,
            waitForConnections: true,
            connectionLimit: 2,
        });

        /**
         * The Drizzle ORM instance for the database.
         */
        this._drizzle = drizzle(this._dbPool);
    }

    /**
     * Get the Drizzle ORM instance.
     * @returns {drizzle} The Drizzle ORM instance.
     */
    get drizzle() {
        return this._drizzle;
    }

    /**
     * Get a MySQL connection from the pool.
     * @returns {Promise<mysql.PoolConnection>} A MySQL connection from the pool.
     * @throws {Error} Throws an error if unable to establish a connection.
     */
    async getConnection() {
        try {
            const connection = await this._dbPool.getConnection();
            return connection;
        } catch (error) {
            console.error("Error getting a database connection:", error);
            throw error;
        }
    }

    /**
     * Checks if the database is connected.
     * 
     * @returns {Promise<boolean>} Resolves to `true` if the database connection is successful, otherwise `false`.
     */
    async dbConnected() {
        try {
            await this.getConnection();
            return true;
        } catch (error) {
            return false;
        }
    }

    /** 
     * Checks if the database connection is configured.
     * 
     * @returns {boolean} Returns `true` if the database connection is configured, otherwise `false`.
     */
    dbExists() {
        if (process.env.DATABASE_URL) return true;
        return false;
    }
}

/**
 * The singleton instance of the DatabaseManager.
 * @type {DatabaseManager}
 */
const dbManager = new DatabaseManager();
Object.freeze(dbManager);

module.exports = dbManager;
