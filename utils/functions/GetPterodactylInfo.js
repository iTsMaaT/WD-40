const { ToEngineerNotation } = require("@functions/formattingFunctions");
const prettyMilliseconds = require("pretty-ms");
const got = require("got");

const GetPterodactylInfo = async function() {
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
            got("https://dash.kpotatto.net/api/client/servers/adc0f433", {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.PTERODACTYL_API_KEY}`,
                },
            }),
            got("https://dash.kpotatto.net/api/client/servers/adc0f433/resources", {
                method: "GET",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.PTERODACTYL_API_KEY}`,
                },
            }),
        ]);

        const serverJson = JSON.parse(serverResponse.body);
        serverName = serverJson.attributes.name;
        RAMlimit = serverJson.attributes.limits.memory;
        CPUlimit = serverJson.attributes.limits.cpu;
        DISKlimit = serverJson.attributes.limits.disk;
        IPalias = serverJson.attributes.relationships.allocations.data[0].attributes.ip_alias;
        IPport = serverJson.attributes.relationships.allocations.data[0].attributes.port;

        const resourcesJson = JSON.parse(resourcesResponse.body);
        RAMusage = resourcesJson.attributes.resources.memory_bytes;
        CPUusage = resourcesJson.attributes.resources.cpu_absolute;
        DISKusage = resourcesJson.attributes.resources.disk_bytes;
        NETWORKin = resourcesJson.attributes.resources.network_rx_bytes;
        NETWORKout = resourcesJson.attributes.resources.network_tx_bytes;
        BOTuptime = resourcesJson.attributes.resources.uptime;
    } catch (err) {
        logger.error(err.stack);
        return undefined;
    }

    const info = {
        ram: {
            limit: {
                raw: parseInt(RAMlimit) * 1024 * 1024,
                clean: `${ToEngineerNotation(parseInt(RAMlimit) * 1024 * 1024)}b`,
            },
            usage: {
                raw: parseInt(RAMusage),
                clean: `${ToEngineerNotation(parseInt(RAMusage))}b`,
            },
            pourcentage: {
                raw: parseInt(RAMusage) / (parseInt(RAMlimit) * 1024 * 1024) * 100,
                clean: (parseInt(RAMusage) / (parseInt(RAMlimit) * 1024 * 1024) * 100).toFixed(2) + "%",
            },
        },
        disk: {
            limit: {
                raw: parseInt(DISKlimit) * 1024 * 1024,
                clean: `${ToEngineerNotation(parseInt(DISKlimit) * 1024 * 1024)}b`,
            },
            usage: {
                raw: parseInt(DISKusage),
                clean: `${ToEngineerNotation(parseInt(DISKusage))}b`,
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
                clean: `${ToEngineerNotation(parseInt(NETWORKin))}b`,
            },
            upload: {
                raw: NETWORKout,
                clean: `${ToEngineerNotation(parseInt(NETWORKout))}b`,
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
module.exports = GetPterodactylInfo;