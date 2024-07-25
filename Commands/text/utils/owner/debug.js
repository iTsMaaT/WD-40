const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "debug",
    description: "Enables debug logging",
    category: "utils",
    usage: {
        required: {
            "server": "server to make superuser",
        },
    },
    private: true,
    async execute(logger, client, message, args, optionalArgs) {
        // Superuser command (Only iTsMaaT can execute commands)
        process.env.CURRENT_DEBUG_STATE = !process.env.CURRENT_DEBUG_STATE;
        return await message.reply({ embeds: [
            embedGenerator.success(`Superuser state set to ${process.env.CURRENT_DEBUG_STATE ? "enabled" : "disabled"}`),
        ] });
    },
};