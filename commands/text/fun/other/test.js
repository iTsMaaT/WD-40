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

module.exports = {
    name: "test",
    description: "Test command",
    category: "fun",
    private: true,
    async execute(logger, client, message, args, optionalArgs) {
        for (const guild of client.guilds.cache.values()) {
            const prefix = GuildManager.GetPrefix(guild.id);
            logger.info(`Guild ${guild.name} (${guild.id}) has prefix ${prefix}`);
        }
    },
};