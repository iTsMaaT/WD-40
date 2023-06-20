const got = require("got");
const { ApplicationCommandType } = require("discord.js");
module.exports = {
    name: "fact",
    description: "Get a random fact",
    type: ApplicationCommandType.ChatInput,
    execute(logger, interaction, client) {

        got("https://uselessfacts.jsph.pl/random.json?language=en")
            .then(response => {
                const fact = JSON.parse(response.body);
                interaction.reply({
                    content: `
**Random fact**:
${fact.text}
            `, allowedMentions: { repliedUser: false }
                });
            })
            .catch((err) => {
                interaction.reply({ content: `An error occorred: ${err}`, ephemeral: true });
                logger.error(err);
            });
    }
};