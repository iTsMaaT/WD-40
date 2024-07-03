module.exports = {
    name: "messagespersecond",
    description: "Gives the mps according to the last 100 messages",
    category: "utils",
    aliases: ["mps"],
    async execute(logger, client, message, args, optionalArgs) {

        const messages = await message.channel.messages.fetch({ limit: 100 });

        const oldestMessage = messages.last();
        const newestMessage = messages.first();
        const timeDifference = newestMessage.createdTimestamp - oldestMessage.createdTimestamp;
        const mps = (messages.size - 1) / (timeDifference / 1000);

        const embed = {
            title: "Messages per seconds (MPS)",
            description: `The approximate MPS is: ${mps.toFixed(5)}m/s`,
            color: 0xffffff,
            timestamp: new Date(),
        };

        message.reply({ embeds: [embed] });
    },
};