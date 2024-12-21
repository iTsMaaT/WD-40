/* eslint-disable no-shadow */
const { eq, and } = require("drizzle-orm");
const logger = require("@utils/log");
const { repositories } = require("../../db/tableManager.js");
const schema = require("../../../schema/schema.js");

async function autoReactFn(guildId) {
    const cache = {};

    try {
        const reactionsRepository = repositories.reactions;
        if (reactionsRepository) {
            const data = await reactionsRepository.select()
                .where(eq(schema.reactions.guildId, guildId));

            if (data.length > 0) {
                for (const i in data) {
                    if (data[i].channelString === undefined) continue;
                    const value = data[i];
                    if (!cache[value.channelString])
                        cache[value.channelString] = [];

                    cache[value.channelString].push({
                        "string": value.string,
                        "emotes": value.emotes,
                    });
                }
            }
        }
    } catch (e) {
        logger.error("Silently failing auto reaction init for guild " + guildId + ", " + e.stack);
    }

    async function addReaction(ChannelPrompt, string, reactions) {
        if (!cache[ChannelPrompt])
            cache[ChannelPrompt] = [];

        cache[ChannelPrompt].push({
            "string": string,
            "emotes": reactions,
        });
        await updateReactionDB(guildId, ChannelPrompt, string);
    }

    async function removeReaction(ChannelPrompt, string = null) {
        if (!string) delete cache[ChannelPrompt];
        if (cache[ChannelPrompt]) {
            // Remove the entry with the matching string
            cache[ChannelPrompt] = cache[ChannelPrompt].filter(entry => entry.string !== string);
            if (cache[ChannelPrompt].length == 0) delete cache[ChannelPrompt];
        }
        await updateReactionDB(guildId, ChannelPrompt, string);
    }

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

    async function getReactions() {
        return cache;
    }

    async function updateReactionDB(guildId, ChannelPrompt, String) {
        const reactionsRepository = repositories.reactions;

        if (reactionsRepository) {
            if (cache[ChannelPrompt]) {
                const reactionsTable = cache[ChannelPrompt].filter(val => val.string === String);
                if (reactionsTable.length > 0) {
                    const Reaction = reactionsTable[0].emotes;
                    
                    await reactionsRepository.upsert({
                        guildId: guildId,
                        emotes: Reaction,
                        channelString: ChannelPrompt,
                        string: String,
                    }, 
                    and(
                        eq(schema.reactions.guildId, guildId),
                        eq(schema.reactions.channelString, ChannelPrompt),
                        eq(schema.reactions.string, String),
                    ));
                }
            } else {
                // Delete all entries for this channel prompt
                await reactionsRepository.remove().where(and(
                    eq(schema.reactions.guildId, guildId),
                    eq(schema.reactions.channelString, ChannelPrompt),
                ));
            }
        }
    }

    return { addReaction, removeReaction, matchReactions, getReactions }; 
}

const reactions = {};

async function getAutoReactions(guildId) {
    if (!reactions[guildId])
        reactions[guildId] = await autoReactFn(guildId);

    return reactions[guildId];
}

module.exports = {
    getAutoReactions,
};