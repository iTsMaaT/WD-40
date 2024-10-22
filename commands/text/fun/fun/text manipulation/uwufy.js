const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "uwufy",
    description: "UwUfies a prompt",
    usage: {
        required: {
            "string": "The text that will be manipulated",
        },
    },
    category: "fun",
    examples: ["Hello, World!"],
    async execute(logger, client, message, args, optionalArgs) {
        
        if (!args[0]) return await message.reply({ embeds: [embedGenerator.warning("You need a prompt")] });

        const UwUprompt = uwufyText(args.join(" "));
        if (UwUprompt.length > 1000) return await message.reply({ embeds: [embedGenerator.error("Prompt too long")] });

        const embed = {
            color: 0xffffff,
            title: "UwUfied text",
            description: UwUprompt,
            timestamp: new Date(),
        };

        message.reply({ embeds: [embed] });


        function uwufyText(text) {
            // Replace 'r' or 'l' followed by a vowel with 'w'
            text = text.replace(/(?:r|l)([aeiou])/gi, "w$1");
            
            // Replace 'n' or 'N' followed by 'a', 'e', 'i', 'o', or 'u' with 'ny'
            text = text.replace(/n([aeiou])/gi, "ny$1");
            
            // Replace 'ove' with 'uv'
            text = text.replace(/ove/gi, "uv");
            
            // Add 'uwu' at the end
            text += " uwu";
          
            return text;
        }
    },
};