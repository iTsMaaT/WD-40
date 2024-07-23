const translate = require("@iamtraction/google-translate");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "translate",
    description: "Translate the replied to message",
    category: "utils",
    async execute(logger, client, message, args, optionalArgs) {
        const LanguageCode = message.guild.preferredLocale.split("-")[0].toString().toLowerCase();

        if (!message.reference) return await message.reply({ embeds: [embedGenerator.warning("You need to reply to a message")] });

        const reference = await message.channel.messages.fetch(message.reference.messageId);
        const text = reference.content;

        try {
            const [enTr, localeTr] = await Promise.all([
                translate(text, { to: "en" }),
                translate(text, { to: LanguageCode }),
            ]);

            if (enTr.text.replace(" ", "") == "" || !enTr.text) throw new Error("Invalid text to translate");

            const embed = {
                color: 0xffffff,
                title: "Translation",
                fields: [
                    { name: "**Original: **", value: text },
                    { name: "**English: **", value: limitString(enTr.text, 1000) },
                ],
                footer: { text: "" },
                timestamp: new Date(),        
            };

            try {
                if (LanguageCode !== "en") embed.fields.push({ name:"**Server language: **", value: limitString(localeTr.text, 1000) });
            } catch (err) {
                logger.error(err);
            }
        
            message.reply({ embeds: [embed] });
                
        } catch (err) {
            logger.error(err.stack);
            return await message.reply({ embeds: [embedGenerator.error("An error occured")] });
        } 

        function limitString(string, limit) {
            if (string.length <= limit) 
                return string;
            else 
                return string.substring(0, limit - 3) + "...";
            
        }
    },
};