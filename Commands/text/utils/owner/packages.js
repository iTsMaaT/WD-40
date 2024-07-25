const { version: discordjsVersion } = require("discord.js");
const { dependencies, name } = require("@root/package.json");
const changelogs = require("@root/changelogs.json");
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { createPaginatedMessage } = require("@utils/helpers/createPaginatedMessage");

module.exports = {
    name: "packages",
    description: "Lists the packages and versions",
    category: "utils",
    private: true,
    async execute(logger, client, message, args, optionalArgs) {
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