const guildSettings = require("./guildSettings");
const blacklist = require("./blacklist");
const autoReactions = require("./autoReactions");
const autoResponses = require("./autoResponses");

module.exports = {
    ...guildSettings,
    ...blacklist,
    ...autoReactions,
    ...autoResponses,
};