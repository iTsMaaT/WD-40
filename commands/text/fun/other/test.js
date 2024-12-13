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
        const msg = await message.reply("https://youtu.be/dQw4w9WgXcQ");
        console.log(msg.embeds[0].data);
    },
};