const SendErrorEmbed = require("../../../../utils/functions/SendErrorEmbed");

module.exports = {
    name: "poll",
    description: "Create a poll",
    category: "utils",
    async execute(logger, client, message, args) {
        if (!args[0] || !args[1]) return SendErrorEmbed(message, "Invalid arguments, please refer to >help poll", "yellow");

        const pollTitle = args.shift();
        const pollDesc = args.shift();
        const dcEmotes = toUnicodeEmote(args);




        function toUnicodeEmote(emotes) {

        }
    },
};
