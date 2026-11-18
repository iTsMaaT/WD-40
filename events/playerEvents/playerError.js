import embedGenerator from "#utils/helpers/embedGenerator.js";

export default {
    name: "playerError",
    once: false,
    /**
     * Notifies the queue's text channel of a playback error and logs its details.
     * @param {import("discord.js").Client} client The Discord client.
     * @param {object} logger The application logger.
     * @param {*} queue The queue where playback failed.
     * @param {Error} error The playback error.
     */
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