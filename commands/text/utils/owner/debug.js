const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "debug",
    description: "Enables debug logging",
    category: "utils",
    usage: {
        required: {
            "server": "server to enable debug",
        },
    },
    private: true,
    async execute(logger, client, message, args, optionalArgs) {
        config.set("defaultDebugState", !config.get("defaultDebugState"));
        return await message.reply({
            embeds: [
                embedGenerator.success(`Debug state set to ${config.get("defaultDebugState") ? "enabled" : "disabled"}`),
            ],
        });
    },
};