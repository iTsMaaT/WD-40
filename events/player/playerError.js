const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "playerError",
    once: false,
    async execute(client, logger, queue, error) {
        await queue.metadata.channel.send({ embeds: [embedGenerator.error({
            title: "Error",
            description: "An error occured, the following track might've been skipped.",
            fields: [{
                name: "**Track title:**",
                value: `[${queue.currentTrack.title}](${queue.currentTrack.url})`,
            }],
        }).withAuthor(queue.metadata.requestedBy)] });
        logger.info(`Queue: ${queue.metadata.guild.name} threw error on track ${queue.currentTrack.title}: \n ${error}`);
    },
};