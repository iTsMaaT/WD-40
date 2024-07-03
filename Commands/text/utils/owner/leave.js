const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "leave",
    category: "admin",
    description: "leaves the specified guild",
    private: true,
    execute(logger, client, message, args, optionalArgs) {
        try {
            if (args[0]) 
                message.client.guilds.cache.get(args[0]).leave();
            else 
                message.client.guild.cache.get(message.guild.id).leave();
            
            message.reply("left: `" + args[0] ?? message.guild.id + "`");
        } catch (err) {
            SendErrorEmbed(message, "Couldn't leave the specified guild", "red");
            logger.error(err);
        }
    },
};