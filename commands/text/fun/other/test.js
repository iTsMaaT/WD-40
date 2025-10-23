const randomMinMax = require("@utils/functions/randomMinMax.js");
const getExactDate = require("@functions/getExactDate.js");
const { prettyString } = require("@functions/formattingFunctions");
const { StringReact } = require("@functions/discordFunctions.js");
const getPterodactylInfo = require("@utils/functions/getPterodactylInfo.js");
const getUniqueValues = require("@utils/functions/getUniqueValues.js");
const EmbedGenerator = require("@utils/helpers/embedGenerator");
const { repositories } = require("@utils/db/tableManager.js");
const guildSettings = require("@utils/guildManager/withDatabase/guildSettings.js");
const GuildManager = require("@guildManager");
const { getAllPlayerStatsSharded } = require("@utils/helpers/playerHelpers");
const { useMainPlayer } = require("discord-player");
const player = useMainPlayer();
module.exports = {
    name: "test",
    description: "Test command",
    category: "fun",
    private: true,
    async execute(logger, client, message, args, flags) {
        console.log(await getAllPlayerStatsSharded(client, player));
    },
};