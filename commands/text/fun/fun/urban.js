const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "urban",
    description: "search something on the urban dictionary",
    usage: {
        required: {
            "search": "The term to search in the urban dictionary",
        },
    },
    category: "fun",
    examples: ["amogus"],

    /**
     * @param {import("@utils/log")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    async execute(logger, client, message, args, flags) {
        try {
            if (!args.length) return await message.reply({ embeds: [embedGenerator.error("No arguments provided.")] });
            const urban = await (await fetch(`https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(args.slice(0).join(" "))}`)).json();

            if (!urban.list[0]) 
                return await message.reply({ embeds: [embedGenerator.error("Invalid argument.")] });
            
            const definition = urban.list[0].definition.replace(/[[\]]/g, "");
            const example = urban.list[0].example.replace(/[[\]]/g, "");
            const author = urban.list[0].author;
            const id = urban.list[0].defid;
    
            const UrbanEmbed = embedGenerator.info({
                title: "Urban Dictionary:",
                url: urban.list[0].permalink,
                description: `**Definition**: ${definition}\n\n**Example**: ${example}`,
                footer: { text: `ID : ${id} | By: ${author}` },
            }).withAuthor(message.author);
    
            message.reply({ embeds: [UrbanEmbed] });
        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error("An error occured")] });
        }
    },
};
