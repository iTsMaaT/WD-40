const SplitIntoChunks = require("@root/utils/functions/splitIntoChunks");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { repository } = require("@root/package.json");

module.exports = {
    name: "source",
    description: "Gives the source code of a command",
    category: "utils",
    async execute(logger, client, message, args, optionalArgs) {
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