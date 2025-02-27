const embedGenerator = require("@utils/helpers/embedGenerator");
const config = require("@utils/config/configUtils");

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
        config.set("defaultSuperuserState", !config.get("defaultSuperuserState"));
        return await message.reply({
            embeds: [
                embedGenerator.success(`Superuser state set to ${config.get("defaultSuperuserState") ? "enabled" : "disabled"}`),
            ],
        });
    },
};