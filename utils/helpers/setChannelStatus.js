const { Routes, REST } = require("discord.js");

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

/**
 * Sets the voice status of a channel.
 * 
 * @param {string} channelid - The channel ID. 
 * @param {string} status - The status to set.
 */
async function setChannelStatus(channelid, status) {
    const route = Routes.channel(channelid) + "/voice-status";

    return rest.put(route, {
        body: {
            status,
        },
    });
}

module.exports = setChannelStatus;