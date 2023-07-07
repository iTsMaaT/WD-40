const { ApplicationCommandType } = require("discord.js");
const translate = require("@iamtraction/google-translate");

module.exports = {
    name: 'Translate',
    type: ApplicationCommandType.Message,
    execute: async(logger, interaction, client) => {
        await interaction.deferReply();
        const LanguageCode = interaction.guild.preferredLocale.split("-")[0].toString().toLowerCase();
        const text = interaction.targetMessage;

        try{
            const [enTr, localeTr] = await Promise.all([
                translate(text, { to: 'en' }),
                translate(text, { to: LanguageCode }),
            ]);

            const embed = {
                color: 0xffffff,
                title: "Translation",
                description: "**English:** " + limitString(enTr.text, 500),
                footer: { text: ""},
                timestamp: new Date(),        
            };

            try {
                if(LanguageCode !== "en") embed.description += "\n**Server language**: " + limitString(localeTr.text, 500);
            } catch (err) {
                logger.error(err);
            }
        
            await interaction.editReply({ embeds: [embed] });
                
        } catch(err) {
            logger.error(err.stack);
            await interaction.editReply({ embeds: [{title: "An error occured.", color: 0xff0000, timestamp: new Date()}] });
        } 

        function limitString(string, limit) {
            if (string.length <= limit) {
                return string; // Return the string as is if it's already within or equal to the limit
            } else {
                return string.substring(0, limit) + "..."; // Append "..." to the truncated string
            }
        }
    },
};