const GetPterodactylInfo = require("@functions/GetPterodactylInfo");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { ToEngineerNotation } = require("@functions/formattingFunctions");

module.exports = {
    name: "botinfo",
    description: "Gives info about the Pterodactyl server",
    category: "info",
    aliases: ["binfo"],
    async execute(logger, client, message, args, optionalArgs) {
        try {
            const PteroInfo = await GetPterodactylInfo();
            const memoryUsage = process.memoryUsage();
            let memoryUsageString = "";
            const rss = ToEngineerNotation(memoryUsage.rss) + "B";
            const heapTotal = ToEngineerNotation(memoryUsage.heapTotal) + "B";
            const heapUsed = ToEngineerNotation(memoryUsage.heapUsed) + "B";
            const external = ToEngineerNotation(memoryUsage.external) + "B";
            const arrayBuffers = ToEngineerNotation(memoryUsage.arrayBuffers) + "B";

            memoryUsageString += `RSS: ${rss}\n`;
            memoryUsageString += `Heap Total: ${heapTotal}\n`;
            memoryUsageString += `Heap Used: ${heapUsed}\n`;
            memoryUsageString += `External: ${external}\n`;
            memoryUsageString += `Array Buffers: ${arrayBuffers}`;
            
            const embed = {
                title: `${process.env.SERVER == "prod" ? "Pterodactyl and" : ""} Process info for ${PteroInfo.main.name}`,
                color: 0xffffff,
                description: `Uptime: ${PteroInfo.uptime.clean}`,
                fields: process.env.SERVER == "prod" ?
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