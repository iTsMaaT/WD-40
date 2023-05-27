const getExactDate = require("./getExactDate")

const CreateUniqueSeed = function(message) {
    let seed = getExactDate().replace(/-|\s|:|\./g, "") +  Math.floor(Math.random() * 9999)
    if (message) seed = message.id
    return seed
}
module.exports = CreateUniqueSeed;