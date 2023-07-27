const SendErrorEmbed = require("@functions/SendErrorEmbed");

module.exports = {
    name: "sarcasm",
    description: "MaKeS a StRiNg LoOk SaRcAsTiC",
    category: "text manipulation",
    usage: "< String >",
    async execute(logger, client, message, args) {
        if (!args[0]) return SendErrorEmbed(message, "You need to provide a prompt.", "yellow");
        if (args.join(" ").length > 1000) return SendErrorEmbed(message, "The result is too long (>1000)", "yellow");

        const prompt = args;
        let sarcasm = "";
        let index = 0;

        for (word of prompt) {
            for (let i = 0; i < word.length; i++) {
                //Alternates between lower and upper case for each chars
                index++;
                if (index % 2 == 0) {
                    sarcasm += word[i].toLowerCase();
                } else {
                    sarcasm += word[i].toUpperCase();
                }
            }
            sarcasm += " ";
        }

        const embed = {
            color: 0xffffff,
            description: sarcasm,
            timestamp: new Date(),
        };
        message.reply({ embeds: [embed] });

    },
};