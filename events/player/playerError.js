const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "playerError",
    once: false,
    async execute(client, logger, queue, error) {
        await queue.metadata.channel.send({ embeds: [embedGenerator.error("An error occured, a track might have been skipped.")] });
        logger.info(`Queue: ${queue.metadata.guild.name} threw error: \n ${error}`);
    },
};