const embedGenerator = require("@utils/helpers/embedGenerator");
const lda = require("@utils/algorithms/lda/lda.js");

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
    async execute(logger, client, message, args, optionalArgs) {
        const count = args[0] || 100;
        if (count > 100) return await message.reply({ embeds: [embedGenerator.error("Message count must be less than 100.")] });
        if (count < 1) return await message.reply({ embeds: [embedGenerator.error("Message count must be greater than 0.")] });

        try {
            const messages = await message.channel.messages.fetch({ limit: count });
            const text = messages.map(m => m.content);
            const result = lda(text, 3, 5);
            const maxLength = Math.max(...result.map(topic => topic.map(t => t.term.length)).flat());

            const resultString = result.map((topic, i) => `Topic ${i + 1}:\n\`\`\`${topic.map(t => `${t.term.padEnd(maxLength)} (${(t.probability * 100).toFixed(1).padStart(4)}%)`).join("\n")}\`\`\``).join("\n\n");

            const embed = embedGenerator.info({
                title: `Topics of the last ${count} messages`,
                description: resultString,
            }).withAuthor(message.author);

            message.reply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            return await message.reply({ embeds: [embedGenerator.error("Failed to fetch messages.")] });
        }
    },
};