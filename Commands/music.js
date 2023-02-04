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
            {name:"`>play <song name>`", value:"Play any song you want (make sure to join a vc first)"},
            {name:"`>stop`", value:"Stop whatever is currently playing"},
            {name:"`>pause`", value:"Pause whatever is currently playing"},
            {name:"`>resume`", value:"Resume paused music"},
            {name:"`>queue`", value:"See the current music queue"},
            {name:"`>shuffle`", value:"Shuffle the music queue"},
            {name:"`>seek`", value:"Fast forward the song that's currently playing"},
            {name:"`>loop`", value:"Loop the current song"},
            {name:"`>leave`", value:"Force the bot to leave the VC"},
            {name:"`>nowplaying`", value:"See the name and progress of the current song"},
            {name:"`>skip`", value:"Skip the currently playing song"},
            {name:"`>volume <0-100>`", value:"Adjust the volume of the music (you can go above 100 but the audio can start to tear)"}
        )
        .setTimestamp()
        message.channel.send({embeds:[embed]})
    }
}
