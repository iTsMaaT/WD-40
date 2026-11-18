const path = require("path");
const { Worker } = require("worker_threads");
const embedGenerator = require("@utils/helpers/embedGenerator");

const WORKER_PATH = path.join(__dirname, "..", "..", "..", "..", "..", "utils", "helpers", "malbolgeWorker.js");

module.exports = {
    name: "malbolge",
    description: "Translates a string to malbolge, the hardest programming language",
    category: "text manipulation",
    usage: {
        required: {
            "string": "The text that will be manipulated",
        },
    },
    examples: ["Hello, World!"],
    aliases: ["mb"],
    cooldown: 10000,
    cooldownGroup: "malbolge",

    /**
     * @param {import("@utils/log")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    async execute(logger, client, message, args, flags) {
        if (!args[0]) return await message.reply({ embeds: [embedGenerator.error("Please provide a string to translate")] });

        const input = args.join(" ");
        const MAX_INPUT_LENGTH = 50;
        const MAX_EXECUTION_TIME = 5000;
        
        if (input.length > MAX_INPUT_LENGTH) {
            return await message.reply({ 
                embeds: [embedGenerator.error(`Input too long! Maximum ${MAX_INPUT_LENGTH} characters allowed.`)], 
            });
        }

        try {
            const malbolge = await new Promise((resolve, reject) => {
                const worker = new Worker(WORKER_PATH, { workerData: { input } });
                
                const timer = setTimeout(() => {
                    worker.terminate();
                    reject(new Error("Malbolge code generation timed out"));
                }, MAX_EXECUTION_TIME);

                worker.once("message", (msg) => {
                    clearTimeout(timer);
                    worker.terminate();
                    msg.error ? reject(new Error(msg.error)) : resolve(msg.result);
                });

                worker.once("error", (err) => {
                    clearTimeout(timer);
                    reject(err);
                });
            });

            if (!malbolge) 
                return await message.reply({ embeds: [embedGenerator.error("Failed to generate Malbolge code")] });
            
            if (malbolge.length < 2000) 
                await message.reply(`\`\`\`malbolge\n${malbolge}\`\`\``);
            else 
                return await message.reply({ embeds: [embedGenerator.error("The result is too long (>2000)")] });
            
        } catch (err) {
            logger.error(err);
            const errorMsg = err.message === "Malbolge code generation timed out" 
                ? "Code generation took too long. Try a shorter input." 
                : "An error occurred";
            return await message.reply({ embeds: [embedGenerator.error(errorMsg)] });
        }
    },
};