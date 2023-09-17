const prettyString = require("./prettyString");

const SendErrorEmbed = async function(message, string, color, err, isSlash) {
    var embed = {
        title: prettyString(string.toString(), false, true),
        timestamp: new Date(),
        color: 0xffffff,
    };
    if (color == "red") embed.color = 0xff0000;
    else if (color == "yellow") embed.color = 0xffff00;
    if (err) embed.description = err;
    if (isSlash) {
        try{
            await message.reply({ embeds: [embed] });
        } catch(err) {
            await message.editReply({ embeds: [embed] });
        }
    } else {
        await message.reply({ embeds: [embed] });
    }
};
module.exports = SendErrorEmbed;