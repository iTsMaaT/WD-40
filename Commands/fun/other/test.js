const CreateUniqueSeed = require("../../../utils/functions/CreateUniqueSeed.js");
const FetchReddit = require("../../../utils/functions/FetchReddit.js");
const RandomMinMax = require("../../../utils/functions/RandomMinMax.js");
const getExactDate = require("../../../utils/functions/getExactDate.js");
const prettyString = require("../../../utils/functions/prettyString.js");
const StringReact = require("../../../utils/functions/StringReact.js");
const ShuffleArray = require("../../../utils/functions/ShuffleArray.js");

module.exports = {
    name: "test",
    description: "Test command",
    category: "fun",
    private: true,
    async execute(logger, client, message, args) {
        array = [1,2,3,4,5,6,7,8,9]
        StringReact(client, message.channel.id, message.id, "sex")
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
            
        );
    }
}