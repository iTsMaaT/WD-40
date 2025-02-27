/* eslint-disable no-shadow */
const logger = require("@utils/log");

/**
 * Initializes the auto reaction system for a guild.
 * @param {string} guildId - The guild ID to initialize the auto reaction system for.
 * @returns {Promise<AutoReactionSystem>} Object containing auto reaction management functions.
 */
async function autoReactFn(guildId) {
    const cache = {};

    /**
     * Adds a new reaction rule to the specified channel.
     * @param {string} ChannelPrompt - The channel identifier or pattern to match.
     * @param {string} string - The trigger string or special pattern (<all>, <media>, <link>, etc.).
     * @param {string} reactions - Semicolon-separated list of reaction emojis.
     * @returns {Promise<void>}
     */
    async function addReaction(ChannelPrompt, string, reactions) {
        if (!cache[ChannelPrompt])
            cache[ChannelPrompt] = [];

        cache[ChannelPrompt].push({
            "string": string,
            "emotes": reactions,
        });
        await updateReactionDB(guildId, ChannelPrompt, string);
    }

    /**
     * Removes a reaction rule from the specified channel.
     * @param {string} ChannelPrompt - The channel identifier to remove reactions from.
     * @param {string} [string=null] - The specific trigger string to remove. If null, removes all rules for the channel.
     * @returns {Promise<void>}
     */
    async function removeReaction(ChannelPrompt, string = null) {
        if (!string) delete cache[ChannelPrompt];
        if (cache[ChannelPrompt]) {
            // Remove the entry with the matching string
            cache[ChannelPrompt] = cache[ChannelPrompt].filter(entry => entry.string !== string);
            if (cache[ChannelPrompt].length == 0) delete cache[ChannelPrompt];
        }
        await updateReactionDB(guildId, ChannelPrompt, string);
    }

    /**
     * Matches message content against reaction rules and returns applicable reactions.
     * @param {string} ChannelPrompt - The channel identifier to check rules for.
     * @param {string} String - The message content to match against.
     * @param {boolean} [hasAttachment=false] - Whether the message contains an attachment.
     * @returns {Promise<string[]>} Array of reaction emojis to add.
     */
    async function matchReactions(ChannelPrompt, String, hasAttachment = false) {
        const matchedReactions = [];

        // Check for reactions in the specified channel and for <all>
        const applicablePrompts = [...Object.keys(cache).filter(cp => ChannelPrompt.includes(cp)), "<all>"];

        for (const channelPrompt of applicablePrompts) {
            if (!cache[channelPrompt]) continue;
            for (const entry of cache[channelPrompt]) {
                const { string, emotes } = entry;

                // Match for specific strings or patterns
                if ((/(https?:\/\/[^\s]+)/.test(String) || hasAttachment) && string === "<media>")
                    matchedReactions.push(...emotes.split(";"));

                if (/(https?:\/\/[^\s]+)/.test(String) && string === "<link>")
                    matchedReactions.push(...emotes.split(";"));

                if (hasAttachment && string === "<attachment>")
                    matchedReactions.push(...emotes.split(";"));

                if (String.includes(string))
                    matchedReactions.push(...emotes.split(";"));

                if (string === "<all>")
                    matchedReactions.push(...emotes.split(";"));
            }
        }

        return matchedReactions;
    }

    /**
     * Returns the current reaction rules cache.
     * @returns {Promise<Object>} The reaction rules cache object.
     */
    async function getReactions() {
        return cache;
    }

    /**
     * Updates the reaction rules in the database.
     * @private
     * @param {string} guildId - The ID of the guild to update.
     * @param {string} ChannelPrompt - The channel identifier.
     * @param {string} String - The trigger string.
     * @returns {Promise<void>}
     */
    async function updateReactionDB(guildId, ChannelPrompt, String) {
        // ...
    }

    return { addReaction, removeReaction, matchReactions, getReactions }; 
}

const reactions = {};

/**
 * Gets or creates an auto reaction system for a guild.
 * @param {string} guildId - The ID of the guild to get reactions for.
 * @returns {Promise<AutoReactionSystem>} The auto reaction system for the guild.
 */
async function getAutoReactions(guildId) {
    if (!reactions[guildId])
        reactions[guildId] = await autoReactFn(guildId);

    return reactions[guildId];
}

module.exports = {
    getAutoReactions,
};