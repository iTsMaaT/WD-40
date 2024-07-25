const { ApplicationCommandType } = require("discord.js");
const embedGenerator = require("@utils/helpers/embedGenerator");
const translate = require("@iamtraction/google-translate");

module.exports = {
    name: "Translate",
    type: ApplicationCommandType.Message,
    execute: async (logger, interaction, client) => {
        const LanguageCode = interaction.guild.preferredLocale.split("-")[0].toString().toLowerCase();
        const text = interaction.targetMessage.content;
        console.log(text);

        try {
            const [enTr, localeTr] = await Promise.all([
                translate(text, { to: "en" }),
                translate(text, { to: LanguageCode }),
            ]);

            if (enTr.text.replace(" ", "") == "" || !enTr.text) throw new Error("Invalid text to translate");

            const embed = embedGenerator.info({
                title: "Translation",
                fields: [
                    { name: "**Original: **", value: text },
                    { name: "**English: **", value: limitString(enTr.text, 1000) },
                ],
            });

            try {
                if (LanguageCode !== "en") embed.data.fields.push({ name:"**Server language: **", value: limitString(localeTr.text, 1000) });
            } catch (err) {
                logger.error(err);
            }
        
            await interaction.editReply({ embeds: [embed] });
                
        } catch (err) {
            logger.error(err.stack);
            await interaction.editReply({ embeds: [embedGenerator.error("An error occured.")] });
        } 

        function limitString(string, limit) {
            if (string.length <= limit) 
                return string;
            else 
                return string.substring(0, limit - 3) + "...";
            
        }
    },
};