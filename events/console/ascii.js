module.exports = {
    name: "ascii",
    execute(client, logger, args) {
        if (!args[0]) return console.log("Argument needed");

        const string = args;
        let result = "";

        for (word of string) {
            for (char of word) {
                const asciiCode = char.charCodeAt(0);
                // Convert ASCII code to binary
                const binaryASCII = asciiCode.toString(2);

                result += binaryASCII + " ";
            }
            result += "/ ";
        }
        console.log(result);
    },
};