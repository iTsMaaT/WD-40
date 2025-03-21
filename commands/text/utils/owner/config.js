const embedGenerator = require("@utils/helpers/embedGenerator");
const { createPaginatedMessage } = require("@utils/helpers/createPaginatedMessage");
const config = require("@utils/config/configUtils");

module.exports = {
    name: "config",
    description: "Manage the current configuration",
    category: "owner",
    private: true,
    async execute(logger, client, message, args, optionalArgs) {
        const subCommand = args[0];
        const key = args[1];
        const value = args.slice(2).join(" ");

        // eslint-disable-next-line no-shadow
        const formatValue = (value, depth = 0) => {
            if (depth > 3) return "[Maximum nesting depth reached]";
            if (typeof value === "object" && value !== null) {
                if (Array.isArray(value)) {
                    return value.length > 3 
                        ? `[${value.slice(0, 3).map(v => formatValue(v, depth + 1)).join(", ")}...] (${value.length} items)`
                        : `[${value.map(v => formatValue(v, depth + 1)).join(", ")}]`;
                }
                const entries = Object.entries(value);
                const indent = "  ".repeat(depth);
                const formattedEntries = entries.slice(0, 3).map(([k, v]) => 
                    `${indent}${k}: ${formatValue(v, depth + 1)}`,
                ).join("\n");
                return entries.length > 3
                    ? `{\n${formattedEntries}\n${indent}...(${entries.length} properties)}`
                    : `{\n${formattedEntries}\n${indent}}`;
            }
            if (typeof value === "string") return `"${value}"`;
            if (typeof value === "undefined") return "undefined";
            if (value === null) return "null";
            return String(value);
        };

        const createConfigEmbed = (title, description) => ({
            title,
            color: 0xffffff,
            description,
            timestamp: new Date(),
        });

        const createFields = (configObj) => {
            const fields = [];
             
            // eslint-disable-next-line no-shadow
            for (const [key, value] of Object.entries(configObj)) {
                const formattedValue = formatValue(value);
                if (formattedValue.length > 1000) {
                    const chunks = formattedValue.match(/.{1,1000}/g) || [];
                    chunks.forEach((chunk, index) => {
                        fields.push({
                            name: index === 0 ? `📝 ${key}` : `📝 ${key} (continued)`,
                            value: `\`\`\`js\n${chunk}\`\`\``,
                            inline: false,
                        });
                    });
                } else {
                    fields.push({
                        name: `📝 ${key}`,
                        value: `\`\`\`js\n${formattedValue}\`\`\``,
                        inline: false,
                    });
                }
            }
            return fields;
        };

        switch (subCommand) {
            case "getall": {
                const allConfig = config.getAll();
                const configEmbed = createConfigEmbed("Configuration", "The current configuration");
                const fields = createFields(allConfig);
                await createPaginatedMessage(message, { embed: configEmbed, fields, fieldsPerPage: 5 });
                break;
            }
            case "get": {
                const configValue = config.get(key);
                const configEmbed = createConfigEmbed("Configuration", `Value for key: ${key}`);
                const fields = createFields({ [key]: configValue });
                await createPaginatedMessage(message, { embed: configEmbed, fields, fieldsPerPage: 5 });
                break;
            }
            case "set": {
                config.set(key, value);
                const configEmbed = createConfigEmbed("Configuration", `Set value for key: ${key}`);
                configEmbed.fields = createFields({ [key]: value });
                await message.reply({ embeds: [configEmbed] });
                break;
            }
            case "reset": {
                config.reset(key);
                const configEmbed = createConfigEmbed("Configuration", `Reset value for key: ${key}`);
                await message.reply({ embeds: [configEmbed] });
                break;
            }
            case "resetall": {
                config.resetAll();
                const configEmbed = createConfigEmbed("Configuration", "Reset all configuration values");
                await message.reply({ embeds: [configEmbed] });
                break;
            }
            case "has": {
                const hasKey = config.has(key);
                const configEmbed = createConfigEmbed("Configuration", `**${key}** ${hasKey ? "exists" : "does not exist"}`);
                await message.reply({ embeds: [configEmbed] });
                break;
            }
            case "delete": {
                config.delete(key);
                const configEmbed = createConfigEmbed("Configuration", `Deleted key: ${key}`);
                await message.reply({ embeds: [configEmbed] });
                break;
            }
            case "save": {
                config.save();
                const configEmbed = createConfigEmbed("Configuration", "Configuration saved");
                await message.reply({ embeds: [configEmbed] });
                break;
            }
            default: {
                const configEmbed = createConfigEmbed("Configuration", "Invalid subcommand");
                await message.reply({ embeds: [configEmbed] });
                break;
            }
        }
    },
};