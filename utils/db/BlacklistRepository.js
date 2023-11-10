const DB = require("./DatabaseManager.js");
const { blacklist } = require("../../schema/schema.js");

/**
 * Insert one or multiple objects
 * @param {} obj The object or array of objects to insert 
 * @returns void
 */
async function insert(obj) {
    return await DB.drizzle.insert(blacklist).values(obj);
}

/**
 * Creates a query builder for Blacklist table. See link for details
 * @link https://orm.drizzle.team/docs/select
 * @returns Drizzle Query Builder
 */
function select() {
    return DB.drizzle.select().from(blacklist);
}

/**
 * Creates a query builder for Blacklist table. See link for details
 * @link https://orm.drizzle.team/docs/update
 * @returns Drizzle Query Builder
 */
function update(updated) {
    return DB.drizzle.update(blacklist).set(updated);
}

/**
 * Creates a query builder for Blacklist table. See link for details
 * @link https://orm.drizzle.team/docs/delete
 * @returns Drizzle Query Builder
 */
function remove() {
    return DB.drizzle.delete(blacklist);
}

module.exports = {
    default: blacklist,
    select,
    update,
    remove,
    insert,
};