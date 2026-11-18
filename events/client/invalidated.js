import { Events } from "discord.js";

export default {
    name: Events.Invalidated,
    once: false,
    log: true,
    /**
     * Reports an invalidated client session and exits so the bot can restart.
     * @param {import("discord.js").Client} client The invalidated Discord client.
     * @param {object} logger The application logger.
     */
    execute(client, logger) {
        logger.severe("The client was invalidated, restarting the bot...");
        client.channels.cache.get(process.env.STATUS_CHANNEL_ID).send("Restarting the bot : Invalidated.");
        setTimeout(function() {
            process.exit(1);
        }, 1000 * 3);   
    },
};