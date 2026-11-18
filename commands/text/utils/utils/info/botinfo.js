import getPterodactylInfo from "#root/utils/functions/getPterodactylInfo.js";
import embedGenerator from "#utils/helpers/embedGenerator.js";
import { toEngineerNotation } from "#functions/formattingFunctions.js";
import formatDuration from "#utils/functions/formatDuration.js";
import packageJson from "#root/package.json" with { type: "json" };
const { name } = packageJson;

export default {
    name: "botinfo",
    description: "Gives info about the Pterodactyl server",
    category: "info",
    aliases: ["binfo"],

    /**
     * @param {import("#utils/log.js")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    async execute(logger, client, message, args, flags) {
        try {
            const PteroInfo = await getPterodactylInfo();
            const memoryUsage = process.memoryUsage();
            let memoryUsageString = "";
            const rss = toEngineerNotation(memoryUsage.rss) + "B";
            const heapTotal = toEngineerNotation(memoryUsage.heapTotal) + "B";
            const heapUsed = toEngineerNotation(memoryUsage.heapUsed) + "B";
            const external = toEngineerNotation(memoryUsage.external) + "B";
            const arrayBuffers = toEngineerNotation(memoryUsage.arrayBuffers) + "B";

            memoryUsageString += `RSS: ${rss}\n`;
            memoryUsageString += `Heap Total: ${heapTotal}\n`;
            memoryUsageString += `Heap Used: ${heapUsed}\n`;
            memoryUsageString += `External: ${external}\n`;
            memoryUsageString += `Array Buffers: ${arrayBuffers}`;
            
            const embed = {
                title: `${process.env.SERVER == "prod" && PteroInfo ? "Pterodactyl and" : ""} Process info for ${PteroInfo?.main?.name ?? name}`,
                color: 0xffffff,
                description: `Uptime: ${PteroInfo?.uptime?.clean ?? formatDuration(process.uptime())}`,
                fields: process.env.SERVER == "prod" && PteroInfo ?
                    [{
                        name: "RAM usage",
                        value: `${PteroInfo.ram.usage.clean} / ${PteroInfo.ram.limit.clean} (${PteroInfo.ram.pourcentage.clean})`,
                    }, {
                        name: "CPU usage (100% = 1 core)",
                        value: `${PteroInfo.cpu.usage}% / ${PteroInfo.cpu.limit}% (${PteroInfo.cpu.pourcentage.clean} or ${PteroInfo.cpu.cores} cores)`,
                    }, {
                        name: "Disk usage",
                        value: `${PteroInfo.disk.usage.clean} / ${PteroInfo.disk.limit.clean} (${PteroInfo.disk.pourcentage.clean})`,
                    }, {
                        name: "Network",
                        value: `IN: ${PteroInfo.network.download.clean}\nOUT: ${PteroInfo.network.upload.clean}`,
                    }] : [],
                footer: {
                    text: "",
                },
                timestamp: new Date(),
            };

            embed.fields.push({
                name: "Process memory usage",
                value: memoryUsageString,
            });

            message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error("Failed to get Pterodactyl info")] });
        }
    },
};