const { Events } = require('discord.js');

module.exports = {
    name: Events.VoiceStateUpdate,
    once: false,
    async execute(client, logger, oldState, newState) {
        const userVoiceStateEvents = {
            userMuted: false,
            userUnmuted: false,
            userDeafened: false,
            userUndeafened: false,
            userServerMuted: false,
            userServerUnmuted: false,
            userServerDeafened: false,
            userServerUndeafened: false,
            userCameraON: false,
            userCameraOFF: false,
            userStreamingON: false,
            userStreamingOFF: false,
            userJoinedChannel: false,
            userLeftChannel: false,
            userMovedChannel: false,
            userSupressed: false,
            userUnsupressed: false,
            userAfkKicked: false,
        };

        if (!oldState.channelId && newState.channelId) {
            //User joins channel
            userVoiceStateEvents.userJoinedChannel = true;
        } else if (oldState.channelId && !newState.channelId) {
            //User leaves channel
            userVoiceStateEvents.userLeftChannel = true;
        } else if (oldState.channelId && newState.channelId && oldState.channelId != newState.channelId) {
            //User moves channel
            userVoiceStateEvents.userMovedChannel = true;
        }

        if (!oldState.selfDeaf && newState.selfDeaf) {
            //User deafens
            userVoiceStateEvents.userDeafened = true;

        } else if (oldState.selfDeaf && !newState.selfDeaf) {
            //User undeafens
            userVoiceStateEvents.userUndeafened = true;

        }

        if (!oldState.selfMute && newState.selfMute) {
            //User mutes
            userVoiceStateEvents.userMuted = true;
        } else if (oldState.selfMute && !newState.selfMute) {
            //User unmutes
            userVoiceStateEvents.userUnmuted = true;
        }

        if (!oldState.selfVideo && newState.selfVideo) {
            //User enables camera
            userVoiceStateEvents.userCameraON = true;
        } else if (oldState.selfVideo && !newState.selfVideo) {
            //User disables camera
            userVoiceStateEvents.userCameraOFF = true;
        }
        
        if (!oldState.serverDeaf && newState.serverDeaf) {
            //User gets server deafened
            userVoiceStateEvents.userServerDeafened = true;
        } else if (oldState.serverDeaf && !newState.serverDeaf) {
            //User gets server undeafened
            userVoiceStateEvents.userServerUndeafened = true;
        }

        if (!oldState.serverMute && newState.serverMute) {
            //User gets server muted
            userVoiceStateEvents.userServerMuted = true;
        } else if (oldState.serverMute && !newState.serverMute) {
            //User gets server unmuted
            userVoiceStateEvents.userServerUnmuted = true;
        }

        if (!oldState.streaming && newState.streaming) {
            //User started streaming
            userVoiceStateEvents.userStreamingON = true;
        } else if (oldState.streaming && !newState.streaming) {
            //User stopped streaming
            userVoiceStateEvents.userStreamingOFF = true;
        }

        //Stage channels
        if (!oldState.suppress && newState.suppress) {
            //User gets suppressed
            userVoiceStateEvents.userSupressed = true;
        } else if (oldState.suppress && !newState.suppress) {
            //User gets unsupressed
            userVoiceStateEvents.userUnsupressed = true;
        }

        if (userVoiceStateEvents.userSupressed && userVoiceStateEvents.userMovedChannel && newState.channel.id == newState.guild.afkChannelId)
            userVoiceStateEvents.userAfkKicked = true;

        //kicked because deleted vc event
        //moved by server admin
        //kicked by server admin

        /*console.log(`Updates for ${newState.member.nickname}`);

        for (const [event, value] of Object.entries(userVoiceStateEvents)) {
            if (value) {
                console.log(event);
            }
        }
        console.log("\n");*/
            
    },
};