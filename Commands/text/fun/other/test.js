const CreateUniqueSeed = require("@functions/CreateUniqueSeed.js");
const RandomMinMax = require("@functions/RandomMinMax.js");
const getExactDate = require("@functions/getExactDate.js");
const prettyString = require("@functions/prettyString.js");
const StringReact = require("@functions/StringReact.js");
const ShuffleArray = require("@functions/ShuffleArray.js");
const GetPterodactylInfo = require("@functions/GetPterodactylInfo.js");
const GetUniqueValues = require("@functions/GetUniqueValues.js");

module.exports = {
    name: "test",
    description: "Test command",
    category: "fun",
    private: true,
    async execute(logger, client, message, args) {
        const array = [1,2,3,4,5,6,7,8,9];
        StringReact(client, message.channel.id, message.id, "sex");
        const ptero = await GetPterodactylInfo();
        message.channel.send(
            prettyString("shut the fuck up", "all", true)
            + "\n" +
            RandomMinMax(69, 420)
            + "\n" +
            getExactDate()
            + "\n" +
            CreateUniqueSeed(message)
            + "\n" +
            CreateUniqueSeed()
            + "\n" +
            ShuffleArray(array).join(", ")
            + "\n" +
            ptero.main.name
            + "\n" +
            GetUniqueValues(["a", "a", "s", "r", "r", "e", "x", "v", "v"])
            
        );
    }
};