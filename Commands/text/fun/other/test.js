const CreateUniqueSeed = require("@functions/CreateUniqueSeed.js");
const RandomMinMax = require("@functions/RandomMinMax.js");
const getExactDate = require("@functions/getExactDate.js");
const { prettyString } = require("@functions/formattingFunctions");
const { StringReact } = require("@functions/discordFunctions.js");
const GetPterodactylInfo = require("@functions/GetPterodactylInfo.js");
const GetUniqueValues = require("@functions/GetUniqueValues.js");

module.exports = {
    name: "test",
    description: "Test command",
    category: "fun",
    private: true,
    async execute(logger, client, message, args, found) {
        
        try {
            const embed = {
                title: "testing",
                description: "yes",
            };
            await message.reply({ embeds: multipleImageEmbed(embed, "https://mc-heads.net/skin/mhf_steve", "https://mc-heads.net/body/mhf_steve", "https://mc-heads.net/avatar/mhf_steve") });
        } catch (err) {
            logger.error(err);
        }
    },
};