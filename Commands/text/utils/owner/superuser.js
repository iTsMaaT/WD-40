const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "superuser",
    description: "Makes only iTsMaaT be able to execute commands",
    category: "utils",
    usage: {
        required: {
            "server": "server to make superuser",
        },
    },
    private: true,
    async execute(logger, client, message, args, optionalArgs) {
        // Superuser command (Only iTsMaaT can execute commands)
        const server = process.env.SERVER;
        if (args[0] == server) {
            process.env.CURRENT_SUPERUSER_STATE = !process.env.CURRENT_SUPERUSER_STATE;
            return await message.reply({ embeds: [
                embedGenerator.success(`Superuser state set to ${process.env.CURRENT_SUPERUSER_STATE ? "enabled" : "disabled"}`),
            ] });
        }
    },
};