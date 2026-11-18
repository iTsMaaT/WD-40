import * as guildSettings from "./guildSettings.js";
import * as blacklist from "./blacklist.js";
import * as autoReactions from "./autoReactions.js";
import * as autoResponses from "./autoResponses.js";

export default {
    ...guildSettings,
    ...blacklist,
    ...autoReactions,
    ...autoResponses,
};