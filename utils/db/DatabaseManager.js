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

        /**
         * The MySQL connection pool.
         * @type {mysql.Pool}
         * @private
         */
        this._dbPool = mysql.createPool({
            uri: process.env.DATABASE_URL,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            connectTimeout: 10000,
        });

        /**
         * The Drizzle ORM instance for the database.
         */
        this._drizzle = drizzle(this._dbPool);

        this._handleDisconnect();
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
     * Reconnects the database if the connection is lost.
     * @private
     */
    _handleDisconnect() {
        this._dbPool.on("connection", (connection) => {
            connection.on("error", async (err) => {
                if (err.code === "PROTOCOL_CONNECTION_LOST") {
                    console.error("Database connection lost. Reconnecting...");
                    await this.getConnection(); // Attempt to reconnect
                } else {
                    throw err;
                }
            });
        });
    }
}

/**
 * The singleton instance of the DatabaseManager.
 * @type {DatabaseManager}
 */
const dbManager = new DatabaseManager();
Object.freeze(dbManager);

module.exports = dbManager;
