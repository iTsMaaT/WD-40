module.exports = {
    name: "debug",
    description: "Blacklist a user from using commands",
    category: "utils",
    private: true,
    execute(logger, client, message, args, optionalArgs) {
        if (message.author.id == process.env.OWNER_ID && !debug) {
            debug = 1;
            message.reply("Debug enabled, check console.");
        } else if (message.author.id == process.env.OWNER_ID && debug) {
            debug = 0;
            message.reply("Debug disabled.");
        }
    },
};