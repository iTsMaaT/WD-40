const { REST } = require("discord.js");
const { Routes } = require("discord.js");

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);

/**
 * @param {string} channelid 
 * @param {string} status 
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