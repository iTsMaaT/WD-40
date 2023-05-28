/**
 * Reacts the provided string to a message
 */
const StringReact = function (ChannelID, MessageID, String) {
    let letters = String.toUpperCase().toString();

    for (i = 0; i < letters.length; i++) {
        if (letters[i] === " ") continue;
        let letter = letters[i];
        client.channels.cache.get(ChannelID).messages.fetch({ cache: false, message: MessageID })
            .then(m => {
                m.react(String.fromCodePoint(letter.codePointAt(0) - 65 + 0x1f1e6));
            }).catch((err) => Logger.error("Error while reacting: " + err));
    }
}
module.exports = StringReact;