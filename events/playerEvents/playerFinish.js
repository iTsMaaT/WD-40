const embedGenerator = require("@utils/helpers/embedGenerator");
const { disableLiveChat } = require("@root/utils/helpers/player/playerLiveChat");

module.exports = {
    name: "playerFinish",
    once: false,
    async execute(client, logger, queue, track) {
        await disableLiveChat(queue.metadata.channel);
    },
};