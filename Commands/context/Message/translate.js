const { ApplicationCommandType } = require("discord.js");
const translate = require("@iamtraction/google-translate");

module.exports = {
    name: "Translate",
    type: ApplicationCommandType.Message,
    execute: async (logger, interaction, client) => {
        await interaction.deferReply();
        const LanguageCode = interaction.guild.preferredLocale.split("-")[0].toString().toLowerCase();
        const text = interaction.targetMessage.content;
        console.log(text);

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
                    { name:  "**English: **", value: limitString(enTr.text, 1000) },
                ],
                footer: { text: "" },
                timestamp: new Date(),        
            };

            try {
                if (LanguageCode !== "en") embed.fields.push({ name:"**Server language: **", value: limitString(localeTr.text, 1000) });
            } catch (err) {
                logger.error(err);
            }
        
            await interaction.editReply({ embeds: [embed] });
                
        } catch (err) {
            logger.error(err.stack);
            await interaction.editReply({ embeds: [{ title: "An error occured.", color: 0xff0000, timestamp: new Date() }] });
        } 

        function limitString(string, limit) {
            if (string.length <= limit) 
                return string;
            else 
                return string.substring(0, limit - 3) + "...";
            
        }
    },
};