const { Events } = require("discord.js");
const { blacklist, whitelist } = require("@root/utils/config.json");

module.exports = {
    name: Events.MessageCreate,
    once: false,
    log: false,
    async execute(client, logger, message) {
        if (message.author.bot) return;
        if (!message.guild) return;

        if (message.content.trim() == `<@${client.user.id}>`) {
            const embed = {
                color: 0xffffff,
                description: `**Prefix** : ${prefix}\n**Help command** : ${prefix}help`,
                timestamp: new Date(),
            };
            message.reply({ embeds: [embed] });
        }

        if (superuser && (message.author.id != process.env.OWNER_ID && whitelist.includes(message.author.id))) return;
        if (blacklist.includes(message.author.id)) return;

        // Snowflake reaction
        if (snowflakeData != []) {
            const expected = [parseInt(message.guildId), parseInt(message.author.id)];
            const exists = snowflakeData.filter(v => {
                return v.equals(expected);
            }).length >= 1;
            if (exists) 
                message.react("❄️");
            
        }

        const autoreactions = await global.GuildManager.getAutoReactions(message.guild.id);
        const reactions = await autoreactions.matchReactions(message.channel.name, message.content, message.attachments.size > 0);
        if (reactions) {
            reactions.forEach(async (reaction) => {
                await message.react(reaction).catch(() => null);
            });
        }

        const autoresponses = await global.GuildManager.getAutoResponses(message.guild.id);
        const responses = await autoresponses.matchResponses(message.channel.name, message.content, message.attachments.size > 0);
        if (responses) {
            responses.forEach(async (res) => {
                await message.reply(res).catch(() => null);
            });
        }

        // Auto-responses
        if (global.GuildManager.GetResponses(message.guild)) {

            if (/((?:https?:\/\/)?(?:www\.)?instagram\.com\/(?:p|reel)\/([^/?#&]+)).*/g.test(message.content)) {
                message.reply(`
**How to download a Instagram media.**
Step 1 - Copy the post's link
Step 2 - Go to this URL (https://snapinsta.app/)     
Step 3 - Paste the link in the "Paste URL Instagram" box
Step 4 - Click download
Step 5 - Send the downloaded media to your favorite social media!
    `);}

            // skull reaction to skull emoji
            if (message.content.toLowerCase() == "💀") 
                message.react("💀");
            

            // Ping fail if doesnt have @everyone perm
            if (message.member && !message.member.permissions.has("MentionEveryone") && (message.content.includes("@everyone") || message.content.includes("@here"))) 
                message.reply("Ping fail L");
            
        }
    },
};