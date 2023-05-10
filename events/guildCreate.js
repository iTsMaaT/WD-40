const { Events } = require('discord.js');

module.exports = {
	name: Events.GuildCreate,
	once: false,
	async execute(client, logger, guild) {
		await global.GuildManager.SetActiveOrCreate(guild);
        logger.info(`The bot has been added to \`${guild.name}\``)
        client.channels.cache.get("1048076076653486090").send(`The bot has been added to \`${guild.name}\``);
	},
};