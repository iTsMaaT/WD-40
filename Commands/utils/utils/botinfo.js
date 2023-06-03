const got = require("got");
const ToEngineerNotation = require("../../../utils/functions/ToEngineerNotation");
const prettyMilliseconds = require('pretty-ms');
const SendErrorEmbed = require("../../../utils/functions/SendErrorEmbed");
const GetPterodactylInfo = require("../../../utils/functions/GetPterodactylInfo");

module.exports = {
    name: 'botinfo',
    description: 'Gives info about the Pterodactyl server',
    category: "utils",
    async execute(logger, client, message, args) {
        message.channel.sendTyping();

            const PteroInfo = await GetPterodactylInfo()
            const embed = {
                title: `Pterodactyl info for ${PteroInfo.main.name} (${PteroInfo.main.ip}:${PteroInfo.main.IPport})`,
                color: 0xffffff,
                description: `Uptime: ${PteroInfo.uptime.clean}`,
                fields: [
                    {
                        name: "RAM usage",
                        value: `${PteroInfo.ram.usage.clean} / ${PteroInfo.ram.limit.clean} (${PteroInfo.ram.pourcentage.clean})`
                    }, {
                        name: "CPU usage",
                        value: `${PteroInfo.cpu.usage}% / ${PteroInfo.cpu.limit}%`
                    }, {
                        name: "Disk usage",
                        value: `${PteroInfo.disk.usage.clean} / ${PteroInfo.disk.limit.clean}B (${PteroInfo.disk.pourcentage.clean})`
                    }, {
                        name: "Network",
                        value: `IN: ${PteroInfo.network.download.clean}\nOUT: ${PteroInfo.network.upload.clean}}`
                    }
                ],
                footer: {
                    text: ''
                },
                timestamp: new Date(),
            };
            message.reply({ embeds: [embed], allowedMentions: { repliedUser: false } });

    }
}