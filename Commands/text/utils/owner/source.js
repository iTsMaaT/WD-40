const SplitIntoChunks = require("@functions/SplitIntoChunks");

module.exports = {
    name: "source",
    category: "utils",
    description: "Gives the source code of a command",
    private: true,
    async execute(logger, client, message, args, optionalArgs) {
        const commandName = args[0];
        const command = client.commands.get(commandName);

        if (!command) return message.channel.send(`Command \`${commandName}\` not found.`);

        const code = command.execute.toString();
        const chunks = SplitIntoChunks(code);

        await message.reply(`Code for command \`${commandName}\``);

        for (const chunk of chunks) 
            await message.channel.send(`\`\`\`javascript\n${chunk}\n\`\`\``);
        
    },
};