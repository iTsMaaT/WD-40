import { version as discordjsVersion } from "discord.js";
import packageJson from "#root/package.json" with { type: "json" };
const { dependencies, name } = packageJson;
import changelogs from "#root/changelogs.json" with { type: "json" };
import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { createPaginatedMessage } from "#utils/helpers/createPaginatedMessage.js";

export default {
    name: "packages",
    description: "Lists the packages and versions",
    category: "owner",
    private: true,

    /**
     * @param {import("#utils/log.js")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    async execute(logger, client, message, args, flags) {
        const WDVersion = changelogs[changelogs.length - 1].version;
    
        const embed = {
            title: "Installed Packages",
            color: 0xffffff,
            description: "The following packages are installed:",
            fields: [],
            timestamp: new Date(),
            footer:{ text: `[Server: ${process.env.SERVER}]` },
        };

        const fields = [];
        fields.push({ name: name.toUpperCase(), value: WDVersion, inline: false });
        fields.push({ name: "discord.js", value: "^" + discordjsVersion, inline: false });
        for (const [packageName, packageVersion] of Object.entries(dependencies)) 
            if (packageName != "discord.js") fields.push({ name: packageName, value: packageVersion, inline: false });
        
        await createPaginatedMessage(message, {
            embed,
            fields,
            fieldsPerPage: 10,
            timeout: 120000,
            buttonLabels: {
                first: "◀◀",
                previous: "◀",
                next: "▶",
                last: "▶▶",
            },
        });
    },
};