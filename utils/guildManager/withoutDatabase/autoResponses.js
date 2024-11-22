/* eslint-disable no-shadow */
const logger = require("@utils/log");

async function autoResponseFn(guildId) {
    const cache = {};

    async function addResponse(ChannelPrompt, string, response) {
        if (!cache[ChannelPrompt])
            cache[ChannelPrompt] = [];

        cache[ChannelPrompt].push({
            "string": string,
            "response": response,
        });
        await updateResponseDB(guildId, ChannelPrompt, string);
    }

    async function removeResponse(ChannelPrompt, string = null) {
        if (!string) delete cache[ChannelPrompt];
        if (cache[ChannelPrompt]) {
            // Remove the entry with the matching string
            cache[ChannelPrompt] = cache[ChannelPrompt].filter(entry => entry.string !== string);
            if (cache[ChannelPrompt].length == 0) delete cache[ChannelPrompt];
        }
        await updateResponseDB(guildId, ChannelPrompt, string);
    }

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


    async function getResponses() {
        return cache;
    }

    async function updateResponseDB(guildId, ChannelPrompt, String) {
        // ...
    }

    return { addResponse, removeResponse, matchResponses, getResponses };
}

const autoResponses = {};

async function getAutoResponses(guildId) {
    if (!autoResponses[guildId])
        autoResponses[guildId] = await autoResponseFn(guildId);

    return autoResponses[guildId];
}

module.exports = {
    getAutoResponses,
};