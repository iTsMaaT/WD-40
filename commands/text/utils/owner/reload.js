const config = require("@utils/config/configUtils");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "reload",
    description: "Reload the config",
    category: "owner",
    private: true,
    async execute(logger, client, message, args, flags) {
        config.reload();
        await message.reply({ embeds: [embedGenerator.success("Reloaded the config.")] });
    },
};