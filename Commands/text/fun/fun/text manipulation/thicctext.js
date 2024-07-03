const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "thicctext",
    description: "Makes a text 丅卄工匚匚",
    category: "text manipulation",
    usage: {
        required: {
            "string": "The text that will be manipulated",
        },
    },
    examples: ["Hello, World!"],
    aliases: ["tt"],
    async execute(logger, client, message, args, optionalArgs) {
        if (!args[0]) return SendErrorEmbed(message, "You need to provide a prompt.", "yellow");
        if (args.join(" ").length > 1000) return SendErrorEmbed(message, "The result is too long (>1000)", "yellow");

        const prompt = args.join(" ").toLowerCase();

        const conversionMap = {
            "a": "卂",
            "b": "乃",
            "c": "匚",
            "d": "刀",
            "e": "乇",
            "f": "下",
            "g": "厶",
            "h": "卄",
            "i": "工",
            "j": "丁",
            "k": "长",
            "l": "乚",
            "m": "从",
            "n": "ん",
            "o": "口",
            "p": "尸",
            "q": "㔿",
            "r": "尺",
            "s": "丂",
            "t": "丅",
            "u": "凵",
            "v": "リ",
            "w": "山",
            "x": "乂",
            "y": "丫",
            "z": "乙",
        };
        
      
        // Converts the compatible characters to their t h i c c counterparts
        let resultText = "";
        for (let i = 0; i < prompt.length; i++) {
            const character = prompt[i];
            resultText += conversionMap[character] || prompt[i];
        }

        const embed = {
            color: 0xffffff,
            description: resultText,
            timestamp: new Date(),
        };
        message.reply({ embeds: [embed] });
    },
};