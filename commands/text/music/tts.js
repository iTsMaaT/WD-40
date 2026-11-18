import { PermissionsBitField } from "discord.js";
import { Readable } from "stream";
import { useQueue, useMainPlayer, QueryType, Track } from "discord-player";
import { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } from "discord-voip";
import config from "#utils/config/configUtils.js";
import embedGenerator from "#utils/helpers/embedGenerator.js";
import { probeStream } from "mediaplex";

export default {
    name: "tts",
    description: "Play a text-to-speech message in the voice channel",
    usage: {
        required: {
            "string": "The text that will be speeched",
        },
    },
    category: "music",
    examples: ["i love eating baguettes"],
    permissions: [PermissionsBitField.Flags.Connect],
    cooldown: 5000,
    inVoiceChannel: true,
    inSameVoiceChannel: true,

    /**
     * @param {import("#utils/log.js")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    async execute(logger, client, message, args, flags) {
        const player = useMainPlayer();
        const playerConfig = config.get("discordPlayer");
        if (!args[0]) return await message.reply({ embeds: [embedGenerator.warning("You must provide a prompt.")] });

        const text = args.join(" ");

        if (text.length > 1000) return await message.reply({ embeds: [embedGenerator.warning("The prompt must be shorter than 1000 characters")] });

        const sent = await message.reply({ embeds: [embedGenerator.info("Getting the TTS...")] });
        
        const res = await player.search(`tts:${text}`);

        const queue = useQueue();
        if (queue && queue.currentTrack) {
            queue.prepend(res.tracks[0], 0);
            queue.node.skip();
        } else {
            await player.play(message.member.voice.channel.id, res, {
                nodeOptions: {
                    verifyFallbackStream: true,
                    metadata: {
                        channel: message.channel,
                        client: message.guild.members.me,
                        requestedBy: message.user,
                        guild: message.guild,
                        probableBridgeSource: "TTS",
                    },
                    ...playerConfig.globalPlayerNodeOptions,
                },
            });
        }
        return await sent.edit({ embeds: [embedGenerator.info("TTS started!")] });
    },
};