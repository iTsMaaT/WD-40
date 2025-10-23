const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "leave",
    description: "Leaves the specified guild",
    category: "owner",
    usage: {
        required: {
            "guild": "ID of the guild to leave",
        },
    },
    private: true,
    async execute(logger, client, message, args, flags) {
        const guildId = args[0] || message.guild.id;

        try {
            // Find and leave the guild on the correct shard
            const results = await client.shard.broadcastEval(async (c, { targetGuildId }) => {
                const guild = c.guilds.cache.get(targetGuildId);
                if (!guild) return null;

                await guild.leave();
                return { id: guild.id, name: guild.name };
            }, { context: { targetGuildId: guildId } });

            // Find which shard actually left the guild
            const leftGuild = results.find(r => r !== null);

            if (leftGuild) 
                await message.reply({ embeds: [embedGenerator.success(`Left **${leftGuild.name}** (${leftGuild.id})`)] });
            else 
                await message.reply({ embeds: [embedGenerator.error(`Guild with ID \`${guildId}\` not found on any shard.`)] });
            
        } catch (err) {
            logger.error(err);
            await message.reply({ embeds: [embedGenerator.error(`Failed to leave guild with ID \`${guildId}\``)] });
        }
    },
};
