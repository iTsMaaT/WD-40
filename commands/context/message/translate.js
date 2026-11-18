import { ApplicationCommandType } from "discord.js";
import embedGenerator from "#utils/helpers/embedGenerator.js";
import translate from "@iamtraction/google-translate";

export default {
    name: "Translate",
    type: ApplicationCommandType.Message,

    /**
     * @param {import("#utils/log.js")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").MessageContextMenuCommandInteraction} interaction The interaction that triggered the command
     * @param {import("discord.js").Client} client The Discord client instance
     * @returns {Promise<void>}
     */
    execute: async (logger, interaction, client) => {
        const LanguageCode = interaction.guild.preferredLocale.split("-")[0].toString().toLowerCase();
        const text = interaction.targetMessage.content;

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
            logger.error(err);
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