const { toEngineerNotation } = require("@functions/formattingFunctions");
const logger = require("@utils/log");
const prettyMilliseconds = require("pretty-ms");

/**
 * Get Pterodactyl server info
 * @returns {Promise<Object>} Object containing server info
 */
const getPterodactylInfo = async function() {
    let serverName = "";
    let RAMlimit = "";
    let CPUlimit = "";
    let DISKlimit = "";
    let IPalias = "";
    let IPport = "";
    let RAMusage = "";
    let CPUusage = "";
    let DISKusage = "";
    let NETWORKin = "";
    let NETWORKout = "";
    let BOTuptime = "";

    try {
        const [serverResponse, resourcesResponse] = await Promise.all([
            fetch(`${process.env.PTERODACTYL_URL}api/client/servers/${process.env.PTERODACTYL_SERVER_ID}`, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.PTERODACTYL_API_KEY}`,
                },
            }),
            fetch(`${process.env.PTERODACTYL_URL}api/client/servers/${process.env.PTERODACTYL_SERVER_ID}/resources`, {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.PTERODACTYL_API_KEY}`,
                },
            }),
        ]);

        const serverJson = await serverResponse.json();
        serverName = serverJson.attributes.name;
        RAMlimit = serverJson.attributes.limits.memory;
        CPUlimit = serverJson.attributes.limits.cpu;
        DISKlimit = serverJson.attributes.limits.disk;
        IPalias = serverJson.attributes.relationships.allocations.data[0].attributes.ip_alias;
        IPport = serverJson.attributes.relationships.allocations.data[0].attributes.port;

        const resourcesJson = await resourcesResponse.json();
        RAMusage = resourcesJson.attributes.resources.memory_bytes;
        CPUusage = resourcesJson.attributes.resources.cpu_absolute;
        DISKusage = resourcesJson.attributes.resources.disk_bytes;
        NETWORKin = resourcesJson.attributes.resources.network_rx_bytes;
        NETWORKout = resourcesJson.attributes.resources.network_tx_bytes;
        BOTuptime = resourcesJson.attributes.resources.uptime;
    } catch (err) {
        logger.error(err);
        return null;
    }

    const info = {
        ram: {
            limit: {
                raw: parseInt(RAMlimit) * 1024 * 1024,
                clean: `${toEngineerNotation(parseInt(RAMlimit) * 1024 * 1024)}b`,
            },
            usage: {
                raw: parseInt(RAMusage),
                clean: `${toEngineerNotation(parseInt(RAMusage))}b`,
            },
            pourcentage: {
                raw: parseInt(RAMusage) / (parseInt(RAMlimit) * 1024 * 1024) * 100,
                clean: (parseInt(RAMusage) / (parseInt(RAMlimit) * 1024 * 1024) * 100).toFixed(2) + "%",
            },
        },
        disk: {
            limit: {
                raw: parseInt(DISKlimit) * 1024 * 1024,
                clean: `${toEngineerNotation(parseInt(DISKlimit) * 1024 * 1024)}b`,
            },
            usage: {
                raw: parseInt(DISKusage),
                clean: `${toEngineerNotation(parseInt(DISKusage))}b`,
            },
            pourcentage: {
                raw: parseInt(DISKusage) / (parseInt(DISKlimit) * 1024 * 1024) * 100,
                clean: (parseInt(DISKusage) / (parseInt(DISKlimit) * 1024 * 1024) * 100).toFixed(2) + "%",
            },
        },
        cpu: {
            limit: CPUlimit,
            usage: CPUusage,
            pourcentage: {
                raw: parseInt(CPUusage) / (parseInt(CPUlimit)) * 100,
                clean: (parseInt(CPUusage) / (parseInt(CPUlimit)) * 100).toFixed(2) + "%",
            },
            cores: (CPUusage / 100).toFixed(2),
        },
        network: {
            download: {
                raw: NETWORKin,
                clean: `${toEngineerNotation(parseInt(NETWORKin))}b`,
            },
            upload: {
                raw: NETWORKout,
                clean: `${toEngineerNotation(parseInt(NETWORKout))}b`,
            },
        },
        uptime: {
            raw: parseInt(BOTuptime),
            clean: prettyMilliseconds(parseInt(BOTuptime)),
        },
        main: {
            name: serverName,
            ip: IPalias,
            port: IPport,
        },
    };
    // console.log(info)
    return info;
};
module.exports = getPterodactylInfo;