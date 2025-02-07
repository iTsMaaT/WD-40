const { Events, AuditLogEvent } = require("discord.js");

module.exports = {
    name: Events.VoiceStateUpdate,
    once: false,
    async execute(client, logger, oldState, newState) {
        const userVoiceStateEvents = {};

        const setEvent = (key) => (userVoiceStateEvents[key] = true);

        const user = newState.member?.nickname || newState.member?.user.username || "Unknown User";

        // Primary actions
        if (!oldState.channelId && newState.channelId) 
            setEvent("userJoinedChannel");
        else if (oldState.channelId && !newState.channelId) 
            setEvent("userLeftChannel");
        else if (oldState.channelId !== newState.channelId) 
            setEvent("userMovedChannel");
        

        // Secondary actions
        if (oldState.selfMute !== newState.selfMute) setEvent(newState.selfMute ? "userMuted" : "userUnmuted");
        if (oldState.selfDeaf !== newState.selfDeaf) setEvent(newState.selfDeaf ? "userDeafened" : "userUndeafened");
        if (oldState.serverMute !== newState.serverMute) setEvent(newState.serverMute ? "userServerMuted" : "userServerUnmuted");
        if (oldState.serverDeaf !== newState.serverDeaf) setEvent(newState.serverDeaf ? "userServerDeafened" : "userServerUndeafened");
        if (oldState.streaming !== newState.streaming) setEvent(newState.streaming ? "userStreamingON" : "userStreamingOFF");
        if (oldState.selfVideo !== newState.selfVideo) setEvent(newState.selfVideo ? "userCameraON" : "userCameraOFF");
        if (oldState.suppress !== newState.suppress) setEvent(newState.suppress ? "userSuppressed" : "userUnsuppressed");

        // AFK kick detection
        if (userVoiceStateEvents.userMovedChannel && newState.channelId === newState.guild.afkChannelId) 
            setEvent("userAfkKicked");
        

        // Kicked due to VC deletion
        if (oldState.channelId && !newState.channelId && !oldState.channel) 
            setEvent("userKickedDeletedVC");
        

        // Check if user was moved by an admin using audit logs
        if (userVoiceStateEvents.userMovedChannel) {
            try {
                const logs = await newState.guild.fetchAuditLogs({ type: AuditLogEvent.MemberMove, limit: 5 });
                const entry = logs.entries.find(e => 
                    e.extra?.channel?.id === newState.channelId && // Check if moved into this channel
                    Date.now() - e.createdTimestamp < 5000,
                );

                if (entry) {
                    setEvent("userMovedByAdmin");
                    userVoiceStateEvents.adminWhoMoved = entry.executor.username;
                }
            } catch (err) {
                logger.warn(`Failed to fetch audit logs: ${err.message}`);
            }
        }

        // Kicked by an admin
        if (oldState.channelId && !newState.channelId && oldState.channel) {
            try {
                const logs = await newState.guild.fetchAuditLogs({ type: AuditLogEvent.MemberDisconnect, limit: 5 });
                const entry = logs.entries.find(e => 
                    e.extra?.channel?.id === oldState.channelId && // Check if kicked from this channel
                    Date.now() - e.createdTimestamp < 5000,
                );

                if (entry) {
                    setEvent("userKickedByAdmin");
                    userVoiceStateEvents.adminWhoKicked = entry.executor.username;
                }
            } catch (err) {
                logger.warn(`Failed to fetch audit logs: ${err.message}`);
            }
        }

        // Final logging (log primary action first, then secondary actions)
        if (Object.keys(userVoiceStateEvents).length > 0) {
            logger.debug(`Voice state update for ${user}:`);
            for (const [event, value] of Object.entries(userVoiceStateEvents)) {
                if (value) {
                    if (event === "adminWhoMoved" || event === "adminWhoKicked") 
                        logger.debug(`  - ${event}: ${value}`);
                    else 
                        logger.debug(`  - ${event}`);
                    
                }
            }
        }
    },
};
