const embedGenerator = require("@utils/helpers/embedGenerator");
const { disableLiveChat } = require("@utils/helpers/playerLiveChat");

module.exports = {
    name: "playerFinish",
    once: false,
    async execute(client, logger, queue, track) {
        await disableLiveChat(queue.metadata.channel);
    },
};