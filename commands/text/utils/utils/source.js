import splitIntoChunks from "#root/utils/functions/splitIntoChunks.js";
import embedGenerator from "#utils/helpers/embedGenerator.js";
import packageJson from "#root/package.json" with { type: "json" };
const { repository } = packageJson;

export default {
    name: "source",
    description: "Gives the source code of a command",
    category: "utils",

    /**
     * @param {import("#utils/log.js")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    async execute(logger, client, message, args, flags) {
        if (args[0]) {
            const commandName = args[0];
            const command = client.commands.get(commandName);

            if (!command) return message.reply({ embeds: [embedGenerator.error("Command not found.")] });
            
            const filePath = command.filePath;

            await message.reply({ embeds: [embedGenerator.info({
                title: "GitHub link",
                description: repository.url.replace(/git\+|\.git/g, "") + "/blob/production/commands" + filePath.split("commands")[1],
            }).withAuthor(message.author)] });
        } else {
            await message.reply({ embeds: [embedGenerator.info({
                title: "GitHub link",
                description: repository.url.replace(/git\+|\.git/g, ""),
            }).withAuthor(message.author)] });
        }
    },
};