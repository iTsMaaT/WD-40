const { eq, and } = require("drizzle-orm");
const logger = require("@utils/log");
const { repositories, schema } = require("../../db/tableManager.js");

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
    function GrantPermission(userId, type, name) {
        if (!CheckPermission(userId, type, name)) {
            bl[userId] = bl[userId].filter(p => p !== `${type}:${name}`);
            UpdateUserInDB(userId);
        }
    }

    /**
     * Denies a specific permission to a user by adding it to their blacklist.
     * 
     * @param {string} userId - The ID of the user.
     * @param {string} permission - The permission to deny.
     */
    function DenyPermission(userId, type, name) {
        if (CheckPermission(userId, type, name)) {
            if (!bl[userId]) bl[userId] = [`${type}:${name}`];
            else bl[userId].push(`${type}:${name}`);
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
            await blacklistRepository.upsert({
                guildId,
                userId,
                permission: bl[userId].join(";").toLowerCase(),
            }, and(
                eq(schema.blacklist.guildId, guildId),
                eq(schema.blacklist.userId, userId),
            ));
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
    function CheckPermission(userId, type, name) {
        const key = `${type}:${name?.toLowerCase()}`;
        return bl[userId] === null || bl[userId] === undefined || !bl[userId].includes(key);
    }

    /**
     * Retrieves the list of denied permissions for a user.
     * 
     * @param {string} userId - The ID of the user.
     * @returns {Array<string>|undefined} An array of denied permissions, or `undefined` if none exist.
     */
    function GetPermissions(userId) {
        const userPermissions = bl[userId] || [];
        return {
            textCommands: userPermissions.filter(p => p.startsWith("cmd:text:")).map(p => p.replace("cmd:text:", "")),
            slashCommands: userPermissions.filter(p => p.startsWith("cmd:slash:")).map(p => p.replace("cmd:slash:", "")),
            contextCommands: userPermissions.filter(p => p.startsWith("cmd:context:")).map(p => p.replace("cmd:context:", "")),
            textCategories: userPermissions.filter(p => p.startsWith("cat:text:")).map(p => p.replace("cat:text:", "")),
            slashCategories: userPermissions.filter(p => p.startsWith("cat:slash:")).map(p => p.replace("cat:slash:", "")),
            contextCategories: userPermissions.filter(p => p.startsWith("cat:context:")).map(p => p.replace("cat:context:", "")),
        };
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
        blacklist[guildId] = await blacklistFn(guildId);

    return blacklist[guildId];
}

module.exports = {
    GetBlacklist,
};