const SplitIntoChunks = require("@functions/SplitIntoChunks");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "source",
    description: "Gives the source code of a command",
    category: "utils",
    async execute(logger, client, message, args, optionalArgs) {
        if (message.author.id == process.env.OWNER_ID && args[0]) {
            const commandName = args[0];
            const command = client.commands.get(commandName);

            if (!command) return message.channel.send(`Command \`${commandName}\` not found.`);

            const code = command.execute.toString();
            const chunks = SplitIntoChunks(code);

            await message.reply(`Code for command \`${commandName}\``);

            for (const chunk of chunks) 
                await message.channel.send(`\`\`\`javascript\n${chunk}\n\`\`\``);
        } else {
            await message.reply({ embeds: [embedGenerator.info({
                title: "GitHub link",
                description: "https://github.com/iTsMaaT/WD-40",
            }).withAuthor(message.author)] });
        }
    },
};