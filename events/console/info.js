const changelog = require("@root/changelogs.json");

module.exports = {
    name: "info",
    execute(client, logger) {
        const uptime = formatUptime(process.uptime());
        const WDVersion = changelog.slice(-1).map(({ version }) => { return version; }).join();
        console.logger(`
        Bot Information:
        - Version: ${WDVersion}
        - Ping: ${client.ws.ping + "ms"}
        - Uptime: ${uptime}
        - Server Count: ${client.guilds.cache.size}
        - User Count: ${client.users.cache.size}`
            .replace(/^\s+/gm, ""));

        function formatUptime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secondsRemainder = Math.floor(seconds % 60);
            return `${hours}h ${minutes}m ${secondsRemainder}s`;
        }
    },
};