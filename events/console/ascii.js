module.exports = {
    name: "ascii",
    /**
     * Converts each supplied word to binary character codes and prints the result.
     * @param {import("discord.js").Client} client The Discord client.
     * @param {object} logger The application logger.
     * @param {string[]} args The words to convert.
     */
    execute(client, logger, args) {
        if (!args[0]) return console.log("Argument needed");

        const string = args;
        const binaryWords = string.map(word =>
            [...word].map(char => char.charCodeAt(0).toString(2)).join(" "),
        );
        const result = binaryWords.join(" / ");
        console.log(result);
    },
};