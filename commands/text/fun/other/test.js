const CreateUniqueSeed = require("@utils/functions/createUniqueSeed.js");
const RandomMinMax = require("@utils/functions/randomMinMax.js");
const getExactDate = require("@functions/getExactDate.js");
const { prettyString } = require("@functions/formattingFunctions");
const { StringReact } = require("@functions/discordFunctions.js");
const GetPterodactylInfo = require("@utils/functions/getPterodactylInfo.js");
const GetUniqueValues = require("@utils/functions/getUniqueValues.js");
const EmbedGenerator = require("@utils/helpers/embedGenerator");
const { repositories } = require("@utils/db/tableManager.js");

module.exports = {
    name: "test",
    description: "Test command",
    category: "fun",
    private: true,
    async execute(logger, client, message, args, optionalArgs) {
        const DBguildIDs = (await repositories.guildsettings.select()).map(item => item.guildId);
        const botGuildIds = client.guilds.cache.map(gui => gui.id);
        const notInGuildIds = DBguildIDs.filter(id => !botGuildIds.includes(id));
        const notInGuildObjects = [];
        for (const notInGuildId of notInGuildIds) {
            const guild = client.guilds.cache.get(notInGuildId);
            if (guild) notInGuildObjects.push(guild);
        }
        console.log(notInGuildObjects);
    },
};