const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "playerError",
    once: false,
    async execute(client, logger, queue, error) {
        const embed = embedGenerator.error({
            title: "Player error",
        }).withAuthor(queue.metadata.requestedBy);

        try {
            embed.data.description = "An error occured, the following track might've been skipped.";
            embed.data.fields = [{
                name: "**Track title:**",
                value: `[${queue.currentTrack.title}](${queue.currentTrack.url})`,
            }];
        } catch (err) {
            embed.data.description = "An error occured, a track might've been skipped";
        }
        
        try {
            await queue.metadata.channel.send({ embeds: [embed] });
        } catch (err) {
            //
        }
        logger.info(`Queue: ${queue.metadata.guild.name} threw error on track ${queue?.currentTrack?.title || "N/A"}: \n ${error}`);
    },
};