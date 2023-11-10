const mysql = require("mysql2");
const { drizzle } = require("drizzle-orm/mysql2");

let instance;

class DatabaseManager {

    _dbConnection = null;
    _drizzle = null;

    constructor() {
        if (instance) throw new Error("Cannot instanciate multiple DB Manager");
        instance = this;

        this._dbConnection = mysql.createConnection(process.env.DATABASE_URL);
        this._drizzle = drizzle(this._dbConnection);
    }

    get drizzle() {
        return this._drizzle;
    }
}

const dbManager = new DatabaseManager();
Object.freeze(dbManager);

module.exports = dbManager;