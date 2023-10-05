const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "rainbow",
    description: "Makes a text rainbow (Doesn't work on mobile)",
    category: "text manipulation",
    usage: "< String >",
    examples: ["Hello, World!"],
    async execute(logger, client, message, args) {
        if (!args[0]) return SendErrorEmbed(message, "You need to provide a prompt.", "yellow");
        if (args.join(" ").length > 250) return SendErrorEmbed(message, "The result is too long (>250)", "yellow");

        //Array of different ansi colors supported by discord (removed grey because ugly)
        const colors = ['[0;31m', '[0;32m', '[0;33m', '[0;34m', '[0;35m', '[0;36m', '[0;37m'];
        const prompt = args.join(" ");

        let colorIndex = 0;
        let result = "";

        for (let i = 0; i < prompt.length; i++) {
            const char = prompt[i];
            if (char !== ' ') {
                //Adds a ansi color code before each letters, then resets using [0;0m
                result += colors[colorIndex % colors.length] + char + "[0;0m";
                colorIndex++;
            } else {
                //Skips spaces
                result += char;
            }
        }

        message.reply("Notice: you cannot see the colors on mobile\n" + `\`\`\`ansi\n${result}\n\`\`\``);
    },
};