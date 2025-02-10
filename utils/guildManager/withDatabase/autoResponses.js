/* eslint-disable no-shadow */
const { eq, and } = require("drizzle-orm");
const logger = require("@utils/log");
const { repositories } = require("../../db/tableManager.js");
const schema = require("../../../schema/schema.js");

/**
 * Initializes the auto response system for a guild.
 * @param {string} guildId - The guild ID to initialize the auto response system for.
 * @returns {Promise<AutoResponseSystem>} Object containing auto response management functions.
 */
async function autoResponseFn(guildId) {
    const cache = {};

    try {
        const responsesRepository = repositories.responses;
        if (responsesRepository) {
            const data = await responsesRepository.select()
                .where(eq(schema.responses.guildId, guildId));

            if (data.length > 0) {
                for (const i in data) {
                    if (data[i].channelString === undefined) continue;
                    const value = data[i];
                    if (!cache[value.channelString])
                        cache[value.channelString] = [];

                    cache[value.channelString].push({
                        "string": value.string,
                        "response": value.response,
                    });
                }
            }
        }
    } catch (e) {
        logger.error("Silently failing auto response init for guild " + guildId + ", " + e.stack);
    }

    /**
     * Adds a new response rule to the specified channel.
     * @param {string} ChannelPrompt - The channel identifier or pattern to match.
     * @param {string} string - The trigger string or special pattern (<all>, <media>, <link>, etc.).
     * @param {string} response - Semicolon-separated list of possible responses.
     * @returns {Promise<void>}
     */
    async function addResponse(ChannelPrompt, string, response) {
        if (!cache[ChannelPrompt])
            cache[ChannelPrompt] = [];

        cache[ChannelPrompt].push({
            "string": string,
            "response": response,
        });
        await updateResponseDB(guildId, ChannelPrompt, string);
    }

    /**
     * Removes a response rule from the specified channel.
     * @param {string} ChannelPrompt - The channel identifier to remove responses from.
     * @param {string} [string=null] - The specific trigger string to remove. If null, removes all rules for the channel.
     * @returns {Promise<void>}
     */
    async function removeResponse(ChannelPrompt, string = null) {
        if (!string) delete cache[ChannelPrompt];
        if (cache[ChannelPrompt]) {
            // Remove the entry with the matching string
            cache[ChannelPrompt] = cache[ChannelPrompt].filter(entry => entry.string !== string);
            if (cache[ChannelPrompt].length == 0) delete cache[ChannelPrompt];
        }
        await updateResponseDB(guildId, ChannelPrompt, string);
    }

    /**
     * Matches message content against response rules and returns applicable responses.
     * @param {string} ChannelPrompt - The channel identifier to check rules for.
     * @param {string} String - The message content to match against.
     * @param {boolean} [hasAttachment=false] - Whether the message contains an attachment.
     * @returns {Promise<string[]>} Array of possible responses.
     */
    async function matchResponses(ChannelPrompt, String, hasAttachment = false) {
        const matchedResponses = [];

        const applicablePrompts = [...Object.keys(cache).filter(cp => ChannelPrompt.includes(cp)), "<all>"];

        if (cache) {
            for (const channelPrompt of applicablePrompts) {
                if (!cache[channelPrompt]) continue;
                for (const entry of cache[channelPrompt]) {
                    const { string, response } = entry;

                    // Check if the string matches <media> or <link> for URLs
                    if ((/(https?:\/\/[^\s]+)/.test(String) || hasAttachment) && string === "<media>")
                        matchedResponses.push(...response.split(";"));


                    if (/(https?:\/\/[^\s]+)/.test(String) && string === "<link>")
                        matchedResponses.push(...response.split(";"));


                    // Check if the string matches <attachment> for attachments
                    if (hasAttachment && string === "<attachment>")
                        matchedResponses.push(...response.split(";"));


                    // Check for other matches anywhere in the strings
                    if (String.includes(string))
                        matchedResponses.push(...response.split(";"));


                    if (string === "<all>")
                        matchedResponses.push(...response.split(";"));

                }
            }
        }

        // if (!matchedResponses[0]) return null;
        return matchedResponses;
    }


    /**
     * Returns the current response rules cache.
     * @returns {Promise<Object>} The response rules cache object.
     */
    async function getResponses() {
        return cache;
    }

    /**
     * Updates the response rules in the database.
     * @private
     * @param {string} guildId - The ID of the guild to update.
     * @param {string} ChannelPrompt - The channel identifier.
     * @param {string} String - The trigger string.
     * @returns {Promise<void>}
     */
    async function updateResponseDB(guildId, ChannelPrompt, String) {
        const responsesRepository = repositories.responses;

        if (responsesRepository) {
            if (cache[ChannelPrompt]) {
                const ResponseTable = cache[ChannelPrompt].filter(val => val.string === String);
                if (ResponseTable.length > 0) {
                    const Response = ResponseTable[0].response;

                    await responsesRepository.upsert({
                        guildId: guildId,
                        response: Response,
                        channelString: ChannelPrompt,
                        string: String,
                    }, 
                    and(
                        eq(schema.responses.guildId, guildId),
                        eq(schema.responses.channelString, ChannelPrompt),
                        eq(schema.responses.string, String),
                    ));
                }
            } else {
                // Delete all entries for this channel prompt
                await responsesRepository.remove().where(and(
                    eq(schema.responses.guildId, guildId),
                    eq(schema.responses.channelString, ChannelPrompt),
                ));
            }
        }
    }

    return { addResponse, removeResponse, matchResponses, getResponses };
}

const autoResponses = {};

/**
 * Gets or creates an auto response system for a guild.
 * @param {string} guildId - The ID of the guild to get responses for.
 * @returns {Promise<AutoResponseSystem>} The auto response system for the guild.
 */
async function getAutoResponses(guildId) {
    if (!autoResponses[guildId])
        autoResponses[guildId] = await autoResponseFn(guildId);

    return autoResponses[guildId];
}

module.exports = {
    getAutoResponses,
};