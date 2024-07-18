const CreateUniqueSeed = require("@functions/CreateUniqueSeed.js");
const RandomMinMax = require("@functions/RandomMinMax.js");
const getExactDate = require("@functions/getExactDate.js");
const { prettyString } = require("@functions/formattingFunctions");
const { StringReact } = require("@functions/discordFunctions.js");
const GetPterodactylInfo = require("@functions/GetPterodactylInfo.js");
const GetUniqueValues = require("@functions/GetUniqueValues.js");
const EmbedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "test",
    description: "Test command",
    category: "fun",
    private: true,
    async execute(logger, client, message, args, optionalArgs) {
        
        message.channel.send({ embeds: [EmbedGenerator.error({ title:"Error", description:"This is an error" }).withAuthor()] });
    },
};