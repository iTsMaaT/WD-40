const embedGenerator = require("@utils/helpers/embedGenerator");
const fetchReddit = require("@root/utils/reddit/fetchReddit.js");

module.exports = {
    name: "scary",
    description: "Good luck",
    category: "posts",
    aliases: ["twosentencehorror"],
    async execute(logger, client, message, args, optionalArgs) {
        try {
            const embed = await fetchReddit(true, ["2sentence2horror"], 20, "sub", "text");
            if (!embed || embed.title === "Couldn't fetch a post after **20** tries") 
                return await message.reply({ embeds: [embedGenerator.error("Failed to find post after 20 tries.")] });
            
            const enhancedEmbed = embedGenerator.info({
                title: embed.title,
                description: embed.description || "",
                color: 0x6b8a70,
            }).withAuthor(message.author);

            await message.reply({ embeds: [enhancedEmbed] });
        } catch (error) {
            logger.error(`Error executing the scary command: ${error.stack}`);
            await message.reply({ embeds: [embedGenerator.error("An unexpected error occurred.")] });
        }
    },
};
