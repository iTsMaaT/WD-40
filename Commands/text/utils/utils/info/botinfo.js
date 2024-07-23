const GetPterodactylInfo = require("@functions/GetPterodactylInfo");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "botinfo",
    description: "Gives info about the Pterodactyl server",
    category: "info",
    aliases: ["binfo"],
    async execute(logger, client, message, args, optionalArgs) {
        try {
            const PteroInfo = await GetPterodactylInfo();
            const embed = {
                title: `Pterodactyl info for ${PteroInfo.main.name}`,
                color: 0xffffff,
                description: `Uptime: ${PteroInfo.uptime.clean}`,
                fields: [
                    {
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
                    },
                ],
                footer: {
                    text: "",
                },
                timestamp: new Date(),
            };
            message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });
        } catch (err) {
            logger.error(err);
            return await message.reply({ embeds: [embedGenerator.error("Failed to get Pterodactyl info")] });
        }
    },
};