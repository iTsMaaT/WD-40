const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "suggestion",
    description: "Suggest ideas for the bot",
    category: "utils",
    async execute(logger, client, message, args, flags) {
        message.reply({ embeds: [embedGenerator.info("To give a suggestion, you can join the support server by doing >help")] });
    },
};
