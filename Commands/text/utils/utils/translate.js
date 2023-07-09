const translate = require("@iamtraction/google-translate");
const SendErrorEmbed = require("@functions/SendErrorEmbed");

module.exports = {
    name: "translate",
    description: "Translate the replied to message",
    usage: "Will translate the message the user replied to",
    category: "utils",
    async execute(logger, client, message, args) {
        const LanguageCode = message.guild.preferredLocale.split("-")[0].toString().toLowerCase();

        if (!message.reference) SendErrorEmbed(message, "You need to reply to a message", "yellow");

        const reference = await message.channel.messages.fetch(message.reference.messageId);
        const text = reference.content;

        try{
            const [enTr, localeTr] = await Promise.all([
                translate(text, { to: 'en' }),
                translate(text, { to: LanguageCode }),
            ]);

            if (enTr.text.replace(" ", "") == "" || !enTr.text) throw new Error("Invalid text to translate");

            const embed = {
                color: 0xffffff,
                title: "Translation",
                fields: [
                    { name: "**Original: **", value: text },
                    { name:  "**English: **", value: limitString(enTr.text, 1000) },
                ],
                footer: { text: ""},
                timestamp: new Date(),        
            };

            try {
                if(LanguageCode !== "en") embed.fields.push({ name:"**Server language: **", value: limitString(localeTr.text, 1000) });
            } catch (err) {
                logger.error(err);
            }
        
            message.reply({ embeds: [embed] });
                
        } catch(err) {
            logger.error(err.stack);
            message.reply({ embeds: [{title: "An error occured.", color: 0xff0000, timestamp: new Date()}] });
        } 

        function limitString(string, limit) {
            if (string.length <= limit) {
                return string;
            } else {
                return string.substring(0, limit - 3) + "...";
            }
        }
    },
};