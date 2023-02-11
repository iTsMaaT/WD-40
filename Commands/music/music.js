const {EmbedBuilder} = require("discord.js")
module.exports={
    name:"music",
    description:"See the music commands",
    execute(logger, client, message, args){
        const embed = new EmbedBuilder()
        .setColor("#FF0000")
        .setTitle("Music commands")
        .setDescription("See the commands for the music features of this bot")
        .addFields(
            {name:"**Basic commands**"},
            {name:"`>play <song name>`", value:"Play any song you want (make sure to join a vc first)"},
            {name:"`>stop`", value:"Stop whatever is currently playing"},
            {name:"`>pause`", value:"Pause whatever is currently playing"},
            {name:"`>resume`", value:"Resume paused music"},
            {name:"`>leave`", value:"Force the bot to leave the VC"},
            {name:"`>skip`", value:"Skip the currently playing song"},
            {name:"**Information**"},
            {name:"`>queue`", value:"See the current music queue"},
            {name:"`>nowplaying`", value:"See the name and progress of the current song"},
            {name:"**Other**"},
            {name:"`>shuffle`", value:"Shuffle the music queue"},
            {name:"`>seek`", value:"Fast forward the song that's currently playing"},
            {name:"`>loop`", value:"Loop the current song"},
            {name:"`>volume <0-100>`", value:"Adjust the volume of the music (you can go above 100 but the audio can start to tear)"},
            {name:"`>playskip`", value:"Skips the entire queue to play a song"},
            {name:"`>repeat`", value:"Put the current song or queue on repeat"},
            {name:"`>skipto`", value:"Skips to a precise song in the queue"},
            {name:"`>seek`", value:"Goes to a precise time in the current song"},
            {name:"`>autoplay`", value:"Will find similar music to try and continue playing songs after the queue"}
        )
        .setTimestamp()
        message.channel.send({embeds:[embed]})
    }
}
