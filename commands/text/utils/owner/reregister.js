const { registerExtractors, reload } = require("@root/utils/helpers/player/registerExtractors");
const { useMainPlayer } = require("discord-player");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "reregister",
    description: "reregisters the extractors",
    category: "owner",
    private: true,
    async execute(logger, client, message, args, flags) {
        await reload(useMainPlayer());
        await message.reply({ embeds: [embedGenerator.success("Reloaded extractors")] });
    },
};