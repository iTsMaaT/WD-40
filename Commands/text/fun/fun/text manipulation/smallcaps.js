const SendErrorEmbed = require("@functions/SendErrorEmbed");

module.exports = {
    name: "smallcaps",
    description: "Mᴀᴋᴇs ʟᴏᴡᴇʀᴄᴀsᴇ ʟᴇᴛᴛᴇʀs ɪɴᴛᴏ sᴍᴀʟʟ ᴄᴀᴘs",
    category: "text manipulation",
    usage: "< String >",
    aliases: ['sc'],
    async execute(logger, client, message, args) {
        if (!args[0]) return SendErrorEmbed(message, "You need to provide a prompt.", "yellow");
        if (args.join(" ").length > 1000) return SendErrorEmbed(message, "The result is too long (>1000)", "yellow");

        const prompt = args.join(" ");

        const conversionMap = {
            'a': 'ᴀ',
            'b': 'ʙ',
            'c': 'ᴄ',
            'd': 'ᴅ',
            'e': 'ᴇ',
            'f': 'ғ',
            'g': 'ɢ',
            'h': 'ʜ',
            'i': 'ɪ',
            'j': 'ᴊ',
            'k': 'ᴋ',
            'l': 'ʟ',
            'm': 'ᴍ',
            'n': 'ɴ',
            'o': 'ᴏ',
            'p': 'ᴘ',
            'q': 'ǫ',
            'r': 'ʀ',
            's': 's',
            't': 'ᴛ',
            'u': 'ᴜ',
            'v': 'ᴠ',
            'w': 'ᴡ',
            'x': 'x',
            'y': 'ʏ',
            'z': 'ᴢ'
        };
          
        
      
        // Converts the compatible characters to their upside down counterparts
        let resultText = '';
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