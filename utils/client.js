import { Client, GatewayIntentBits, Partials } from "discord.js";

const neededIntents = {
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildExpressions,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
    ],
};

/**
 * The bot's Discord client, shared by every module.
 * Lives in its own module so it can be imported without importing the entry point.
 */
const client = new Client({
    ...neededIntents,
    shards: "auto",
    allowedMentions: { parse: ["users"], repliedUser: false },
});

export { client };
