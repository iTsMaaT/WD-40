const CreateUniqueSeed = require("../../../utils/functions/CreateUniqueSeed.js");
const FetchReddit = require("../../../utils/functions/FetchReddit.js");
const RandomMinMax = require("../../../utils/functions/RandomMinMax.js");
const getExactDate = require("../../../utils/functions/getExactDate.js");
const prettyString = require("../../../utils/functions/prettyString.js");

module.exports = {
    name: "test",
    description: "Test command",
    category: "fun",
    private: true,
    async execute(logger, client, message, args) {
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
);
    }
}
