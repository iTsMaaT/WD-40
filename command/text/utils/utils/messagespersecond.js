const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "messagespersecond",
    description: "Gives the mps according to the last 100 messages",
    category: "utils",
    aliases: ["mps"],
    async execute(logger, client, message, args, optionalArgs) {
        try {
            const messages = await message.channel.messages.fetch({ limit: 100 });

            const oldestMessage = messages.last();
            const newestMessage = messages.first();
            const timeDifference = newestMessage.createdTimestamp - oldestMessage.createdTimestamp;
            const mps = (messages.size - 1) / (timeDifference / 1000);

            const embed = embedGenerator.info({
                title: "Messages per seconds (MPS)",
                description: `The approximate MPS is: ${mps.toFixed(5)}m/s`,
            }).withAuthor(message.author);

            message.reply({ embeds: [embed] });
        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error("An error occured")] });
        }
    },
};