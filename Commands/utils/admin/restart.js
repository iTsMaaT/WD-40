const prettyMilliseconds = require('pretty-ms');
module.exports = {
    name: "restart",
    description: "Restart the bot from discord",
    category: "utils",
    private: true,
    execute(logger, client, message, args) {
        const server = process.env.SERVER;
        if (message.author.id == process.env.OWNER_ID) {
            logger.severe(`Restart requested from discord`);
            message.reply("Restarting the bot.");
            client.channels.cache.get("1037141235451842701").send(`Restart requested from discord for reason : \`${args.join(" ")}\``);

            //After 3s, closes the database and then exits the process
            setTimeout(function () {
                /****************/
                global.prisma.$disconnect();
                process.exit(1);
                /****************/
            }, 1000 * 3)
            return;
        }

        if (message.author.id == process.env.OWNER_ID && (args[0] == server)) {
            logger.severe(`Restart requested from discord on \`${server}\` server`);
            message.reply("Restarting the bot.");
            client.channels.cache.get("1037141235451842701").send(`Restart requested from discord on \`${server}\` server`);

            //After 3s, closes the database and then exits the process
            setTimeout(function () {
                /****************/
                global.prisma.$disconnect();
                process.exit(1);
                /****************/
            }, 1000 * 3)
            return;
        }
    }
}