const { SendErrorEmbed } = require("@functions/discordFunctions");
const lda = require("lda");

module.exports = {
    name: "topic",
    description: "Uses Latent Dirichlet allocation to get the topic of the last X messages.",
    usage: {
        required: {
            "message count": "amount of messages to check (max 100)",
        },
    },
    category: "utils",
    examples: ["50"],
    async execute(logger, client, message, args, found) {
        const count = args[0];
        if (count > 100) return SendErrorEmbed(message, "Message count must be less than 100.", "red");
        if (count < 1) return SendErrorEmbed(message, "Message count must be greater than 0.", "red");

        try {
            const messages = await message.channel.messages.fetch({ limit: count });
            const text = messages.map(m => m.content);
            const result = lda(text, 1, 5)[0];
            const maxLength = Math.max(...result.map(t => t.term.length));

            const resultString = result
                .map(t => `${t.term.padEnd(maxLength)} (${(t.probability * 100).toFixed(1).padStart(4)}%)`)
                .join("\n");

            const embed = {
                title: `Topic of the last ${count} messages`,
                color: 0xffffff,
                description: resultString,
                timestamp: new Date(),
            };

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return SendErrorEmbed(message, "Failed to fetch messages.", "red");
        }
    },
};