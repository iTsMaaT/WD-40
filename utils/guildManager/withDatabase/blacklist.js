const { eq, and } = require("drizzle-orm");
const logger = require("@utils/log");
const { repositories } = require("../../db/tableManager.js");
const schema = require("../../../schema/schema.js");

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

    try {
        const data = await repositories.blacklist.select().where(eq(schema.blacklist.guildId, guildId));
        if (data.length > 0) {
            data.forEach((value) => {
                if (value.userId)
                    bl[value.userId] = new String(value.permission).toLowerCase().split(";");

            });
        }
    } catch (e) {
        logger.error("Error while initializing blacklist for guild " + guildId + ": " + e.stack);
    }

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
        const blacklistRepository = await repositories.blacklist;
        try {
            const exists = blacklistRepository.select().where(and(
                eq(schema.blacklist.guildId, guildId),
                eq(schema.blacklist.userId, userId),
            ));
            if (exists.length > 0) {
                await blacklistRepository.update({ permission: bl[userId].join(";").toLowerCase() }).where(and(
                    eq(blacklistSchema.guildId, guildId),
                    eq(blacklistSchema.userId, userId),
                ));
            } else {
                await blacklistRepository.insert({
                    guildId,
                    userId,
                    permission: bl[userId].join(";").toLowerCase(),
                });
            }
        } catch (e) {
            logger.error(`Unable to update Blacklist table (U: ${userId} | G: ${guildId} | P: '${bl[userId].join(";")}')\r\n${e.stack}`);
        }
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