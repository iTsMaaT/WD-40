const { SendErrorEmbed } = require("@functions/discordFunctions");
const { Readable } = require("stream");
const { useQueue } = require("discord-player");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus } = require("@discordjs/voice");
const fs = require("fs/promises");
const path = require("path");

module.exports = {
    name: "gamer",
    description: "Do not",
    category: "music",
    private: true,
    permissions: ["Connect"],
    async execute(logger, client, message, args) {
        const queue = useQueue(message.guild.id);

        if (!message.member.voice.channel) return SendErrorEmbed(message, "You must be in a voice channel.", "yellow");
        
        try {
            
            const filePath = path.join(__dirname, "gamer64.txt");
            let base64Data = await fs.readFile(filePath, { encoding: "utf-8" });
            base64Data = base64Data.replace(/(\n|\s)/g, "");
            const buffer = Buffer.from(base64Data, "base64");
            const stream = new Readable();
            stream._read = () => {/**/};
            stream.push(buffer);
            stream.push(null);

            
            if (!queue) {
                message.guild.me.voice?.setChannel(null).catch(() => null);
                const connection = joinVoiceChannel({
                    channelId: message.member.voice.channel.id,
                    guildId: message.guild.id,
                    adapterCreator: message.guild.voiceAdapterCreator,
                });
                
                const player = createAudioPlayer();
                connection.subscribe(player);
                player.play(createAudioResource(stream));
                
                player.on(AudioPlayerStatus.Idle, () => {
                    player.stop();
                    connection.destroy(); // No more audio elements, destroy the connection     
                });
            } else {
                const track = queue.voiceReceiver.createRawTrack(stream, {
                    title: "gamer",
                    requestedBy: message.author,
                    author: "me",
                });
                
                queue.insertTrack(track, 0);
                queue.node.skip();
            }
        } catch (err) {
            logger.error(err);
            return SendErrorEmbed(message, "Error while gaming", "red");
        }

        message.reply({ embeds: [{ title: "Gaming", timestamp: new Date(), color: 0xffffff }] });
    },
};