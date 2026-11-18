const embedGenerator = require("@utils/helpers/embedGenerator");
const { disableLiveChat } = require("@root/utils/helpers/player/playerLiveChat");

module.exports = {
    name: "playerFinish",
    once: false,
    /**
     * Disables live chat after the current track finishes.
     * @param {import("discord.js").Client} client The Discord client.
     * @param {object} logger The application logger.
     * @param {*} queue The queue whose track finished.
     * @param {*} track The track that finished playing.
     */
    async execute(client, logger, queue, track) {
        await disableLiveChat(queue.metadata.channel);
    },
};