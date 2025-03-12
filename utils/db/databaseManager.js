const { migrateMysql, migrateSqlite } = require('./databaseMigrator.js');

let instance;

/**
 * Class representing a Database Manager.
 */
class DatabaseManager {
    driver = 'mysql';

    /**
     * Create a DatabaseManager instance.
     * @throws {Error} Throws an error if an instance of DatabaseManager already exists.
     */
    constructor() {
        if (instance) throw new Error("Cannot instantiate multiple DB Managers");
        instance = this;
        let drizzle = null;

        if (!this.dbExists()) return;

        if (process.env.DATABASE_URL.startsWith('sqlite:')) {
            // Set driver to SQLITE & configure drizzle to use sqlite database
            this.driver = 'sqlite'
            this._dbPool = require("better-sqlite3")(process.env.DATABASE_URL.substring(7), { fileMustExist: false });
            this._dbPool.pragma('journal_mode = WAL'); // Recommened for performance

            // Run migration that needs to be run
            migrateSqlite(this._dbPool);
            console.info('Database migrations were executed successfully.')

            // Get the necessary drizzle driver for SQLITE
            drizzle = require('drizzle-orm/better-sqlite3').drizzle;
        } else {
            // Set driver to MYSQL & configure drizzle to use MySQL database
            this.driver = 'mysql'
            const mysql = require("mysql2/promise");
            this._dbPool = mysql.createPool({
                uri: process.env.DATABASE_URL,
                waitForConnections: true,
                connectionLimit: 2,
            });

            // Run migration that needs to be run
            (async () => {
                let conn = await this._dbPool.getConnection()
                let res = await migrateMysql(conn);
                this._dbPool.releaseConnection(conn);
                return res;
            })().then(console.info('Database migrations were executed successfully.'));

            // Get the necessary drizzle driver for MYSQL
            drizzle = require("drizzle-orm/mysql2").drizzle;
        }


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
        if (this.driver == 'sqlite') return true; // No need to check for sqlite
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

    getSchema() {
        return require(__dirname + '/schemas/' + this.driver + '.js');
    }

    close() {
        if (this.driver != 'sqlite') return; // Only needed for SQLite
        this._dbPool.close();
    }
}

/**
 * The singleton instance of the DatabaseManager.
 * @type {DatabaseManager}
 */
const dbManager = new DatabaseManager();
Object.freeze(dbManager);

module.exports = dbManager;
