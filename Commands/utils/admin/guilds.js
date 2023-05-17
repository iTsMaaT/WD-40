module.exports = {
    name: "guilds",
    category: "utils",
    description: "Makes a list of the guilds the bot is in",
    private: true,
    execute(logger, client, message, args) {
        if (message.author.id == process.env.OWNER_ID) {
            //Maps all guilds and their IDs
            let content = client.guilds.cache.map(guild => `${guild.name} (\`${guild.id}\`)`).join("\n");
            message.reply({ content, allowedMentions: { repliedUser: false } });
            

            /* Antoine stupide (it works ig)
            console.log(client.guilds.cache.map(guild => guild.name).reduce((previous,current) => {
                return previous + "\n" + current
            }, "").substring(2))
            */
        }
    }
}