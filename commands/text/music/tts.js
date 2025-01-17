const { PermissionsBitField } = require("discord.js");
const { Readable } = require("stream");
const { useQueue, useMainPlayer, QueryType, Track } = require("discord-player");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("discord-voip");
const { getAllAudioBase64 } = require("google-tts-api");
const config = require("@utils/config/configUtils");
const embedGenerator = require("@utils/helpers/embedGenerator");
const { probeStream } = require("mediaplex");
const { TTSExtractor } = require("tts-extractor");

module.exports = {
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
    async execute(logger, client, message, args, optionalArgs) {
        let sent;
        const player = useMainPlayer();
        const playerConfig = config.get("discordPlayerConf");
        if (!message.member.voice.channel) return await message.reply({ embeds: [embedGenerator.warning("You must be in a voice channel.")] });
        if (!args[0]) return await message.reply({ embeds: [embedGenerator.warning("You must provide a prompt.")] });

        const text = args.join(" ");

        if (text.length > 1000) return await message.reply({ embeds: [embedGenerator.warning("The prompt must be shorter than 1000 characters")] });

        try {
            sent = await message.reply({ embeds: [embedGenerator.info("Getting the TTS...")] });
        
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
        } catch (err) {
            logger.error(err);
            return await sent.edit({ embeds: [embedGenerator.error("An error occurred.")] });
        }
    },
};