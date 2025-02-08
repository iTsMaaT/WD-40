const randomMinMax = require("@utils/functions/randomMinMax.js");
const getExactDate = require("@functions/getExactDate.js");
const { prettyString } = require("@functions/formattingFunctions");
const { StringReact } = require("@functions/discordFunctions.js");
const getPterodactylInfo = require("@utils/functions/getPterodactylInfo.js");
const getUniqueValues = require("@utils/functions/getUniqueValues.js");
const EmbedGenerator = require("@utils/helpers/embedGenerator");
const { repositories } = require("@utils/db/tableManager.js");

module.exports = {
    name: "test",
    description: "Test command",
    category: "fun",
    private: true,
    async execute(logger, client, message, args, optionalArgs) {
        //
    },
};