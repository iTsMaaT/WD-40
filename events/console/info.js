const changelog = require('@root/changelogs.json');

module.exports = {
    name: "info",
    execute(client, logger) {
        const uptime = formatUptime(process.uptime());
        const WDVersion = changelog.slice(-1).map(({version}) => { return version; }).join();
        console.log('Bot Information:');
        console.log('- Version: ' + WDVersion);
        console.log('- Ping: ' + client.ws.ping + "ms");
        console.log('- Uptime: ' + uptime);
        console.log('- Server Count: ' + client.guilds.cache.size);
        console.log('- User Count: ' + client.users.cache.size);

        function formatUptime(seconds) {
            const hours = Math.floor(seconds / 3600);
            const minutes = Math.floor((seconds % 3600) / 60);
            const secondsRemainder = Math.floor(seconds % 60);
            return `${hours}h ${minutes}m ${secondsRemainder}s`;
        }
    }
};