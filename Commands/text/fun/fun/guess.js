const akinator = require("discord.js-akinator");

module.exports = {
    name: "guess",
    description: "Guess a character with akinator",
    category: "fun",
    async execute(logger, client, message, args, optionalArgs) {
        akinator(message, {
            language: "en", // Defaults to "en"
            childMode: false, // Defaults to "false"
            gameType: "character", // Defaults to "character"
            useButtons: true, // Defaults to "false"
            embedColor: "#ffffff", // Defaults to "Random"
        });
    },
};