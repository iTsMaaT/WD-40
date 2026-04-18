module.exports = {
    name: "ascii",
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