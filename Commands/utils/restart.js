const prettyMilliseconds = require('pretty-ms');
module.exports = {
    name: "restart",
    description: "Restart the bot from discord",
    category: "utils",
    private: true,
    execute(logger, client, message, args) {
        if (message.author.id == 411996978583699456) {
            logger.severe("Restart requested from discord...");
            message.reply("Restarting the bot.");
            client.channels.cache.get("1037141235451842701").send("Restart requested from discord...");
            
            //After 3s, closes the database and then exits the process
            setTimeout(function () {
            /****************/
            global.prisma.$disconnect();
            process.exit(1);
            //client.channels.cache.get().send();
            /****************/
            }, 1000 * 3)
        }
        else if (message.member.permissions.has("Administrator")) {
            //If admin attemps to execute, tells them to contact iTsMaaT
            message.channel.send(`Please contact the owner of this bot to execute this command (iTsMaaT#4020 or <@411996978583699456>)`);
        }
        else {
            //If normal user, blocks access to the command
            message.channel.send(`nah`);
        }
    }
}