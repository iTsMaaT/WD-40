const logger = require("@utils/log");

/**
 * Creates and manages a blacklist for a given guild.
 * Provides methods to grant, deny, check, and retrieve user permissions.
 * 
 * @async
 * @param {string} guildId - The ID of the guild for which the blacklist is being managed.
 * @returns {object} The blacklist manager with permission control methods.
 */
async function blacklistFn(guildId) {
    const bl = {};

    /**
     * Grants a specific permission to a user by removing it from their blacklist.
     * 
     * @param {string} userId - The ID of the user.
     * @param {string} permission - The permission to grant.
     */
    function GrantPermission(userId, permission) {
        if (!CheckPermission(userId, permission)) {
            bl[userId] = bl[userId].filter(p => p != permission?.toLowerCase());
            UpdateUserInDB(userId);
        }
    }

    /**
     * Denies a specific permission to a user by adding it to their blacklist.
     * 
     * @param {string} userId - The ID of the user.
     * @param {string} permission - The permission to deny.
     */
    function DenyPermission(userId, permission) {
        if (CheckPermission(userId, permission)) {
            if (bl[userId] === null || bl[userId] === undefined)
                bl[userId] = [permission?.toLowerCase()];
            else
                bl[userId].push(permission?.toLowerCase());

            UpdateUserInDB(userId);
        }
    }

    /**
     * Updates a user's blacklist in the database.
     * 
     * @async
     * @param {string} userId - The ID of the user.
     */
    async function UpdateUserInDB(userId) {
        // ...
    }

    /**
     * Checks if a user has a specific permission.
     * 
     * @param {string} userId - The ID of the user.
     * @param {string} permission - The permission to check.
     * @returns {boolean} `true` if the user has the permission, otherwise `false`.
     */
    function CheckPermission(userId, permission) {
        return bl[userId] === null || bl[userId] === undefined || !bl[userId].includes(permission?.toLowerCase());
    }

    
    /**
     * Retrieves the list of denied permissions for a user.
     * 
     * @param {string} userId - The ID of the user.
     * @returns {Array<string>|undefined} An array of denied permissions, or `undefined` if none exist.
     */
    function GetPermissions(userId) {
        return bl[userId];
    }

    return { GrantPermission, DenyPermission, CheckPermission, GetPermissions };
}

const blacklist = {};

/**
 * Retrieves or initializes a blacklist for a given guild.
 * 
 * @async
 * @param {string} guildId - The ID of the guild.
 * @returns {Promise<object>} The blacklist manager for the guild.
 */
async function GetBlacklist(guildId) {
    if (!blacklist[guildId])
        blacklist[guildId] = blacklistFn(guildId);

    return blacklist[guildId];
}

module.exports = {
    GetBlacklist, 
};