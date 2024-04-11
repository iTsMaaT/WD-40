const DB = require("./DatabaseManager.js");
const fullSchema = require("../../schema/schema.js");

/**
 * Generates repository functions for a given table.
 * @param {Object} table The table object representing the database table.
 * @returns {Object} Repository functions for the table.
 */
function generateRepositoryFunctions(table) {
    /**
     * Insert one or multiple objects into the table.
     * @param {Object|Object[]} obj The object or array of objects to insert.
     * @returns {Promise<void>} A Promise that resolves when the insertion is complete.
     */
    async function insert(obj) {
        return await DB.drizzle.insert(table).values(obj);
    }

    /**
     * Creates a query builder for the table.
     * @returns {QueryBuilder} Drizzle Query Builder for the table.
     */
    function select() {
        return DB.drizzle.select().from(table);
    }

    /**
     * Creates a query builder for updating records in the table.
     * @param {Object} updated The updated values.
     * @returns {Promise<void>} A Promise that resolves when the update is complete.
     */
    async function update(updated) {
        return await DB.drizzle.update(table).set(updated);
    }

    /**
     * Creates a query builder for deleting records from the table.
     * @returns {Promise<void>} A Promise that resolves when the deletion is complete.
     */
    async function remove() {
        return await DB.drizzle.delete(table);
    }

    /**
     * Upserts (inserts or updates) a record into the table.
     * @param {Object} obj The object to upsert.
     * @param {Object} [filter] The filter object to find existing records (optional).
     * @returns {Promise<void>} A Promise that resolves when the upsert is complete.
     */
    async function upsert(obj, filter) {
        if (filter) {
            const existingRecord = await select().where(filter);
            if (existingRecord) 
                await update(obj).where(filter);
            else 
                await insert(obj);
            
        } else {
            await insert(obj);
        }
    }

    return {
        insert,
        select,
        update,
        remove,
        upsert,
        default: table,
    };
}

/**
 * Module for managing database repositories.
 */
const RepositoryManager = {
    /**
     * Generates repository functions for each table in the schema.
     * @param {Object} schema The schema object representing the database schema.
     * @returns {Object} Repository functions for each table.
     */
    generateRepositories(schema) {
        const repositories = {};

        for (const tableKey in schema) {
            const table = schema[tableKey];
            repositories[tableKey] = generateRepositoryFunctions(table);
        }

        return repositories;
    },
};

const repositories = RepositoryManager.generateRepositories(fullSchema);
module.exports = { repositories };
