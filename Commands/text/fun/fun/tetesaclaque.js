const { prettyString } = require("@functions/formattingFunctions");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
    name: "tetesaclaque",
    description: "Tells you which tetes a claque you are",
    category: "fun",
    aliases: ["tac"],
    async execute(logger, client, message, args, optionalArgs) {
        const tacs = {
            "fernand": "Fernand",
            "gabriel_samuel": "Gabriel",
            "gabriel_samuel2": "Samuel",
            "ginette_tony": "Ginette",
            "ginette_tony2": "Tony",
            "jimmy_rejean": "Jimmy",
            "jimmy_rejean2": "Rejean",
            "julie_simon": "Julie",
            "julie_simon2": "Simon",
            "les_chasseurs": "Les chasseurs",
            "monique_lucien": "Monique",
            "monique_lucien2": "Lucien",
            "natacha": "Natacha",
            "oncleTom": "Oncle Tom",
            "pilote": "Le pilote",
            "raoul": "Raoul",
            "rene_charles": "Rene-Charles",
            "ti_papoutes": "Ti-Papoutes",
            "turcotte": "Turcotte",
            "yvon": "Yvon",
        };
        const randomTacIndex = Math.floor(Math.random() * Object.keys(tacs).length);
        let tac = tacs[Object.keys(tacs)[randomTacIndex]];
        const tacimage = `https://www.tetesaclaques.tv/public/images/series/fr-ca/${Object.entries(tacs)[randomTacIndex][0].replace(/[1-9]/g, "")}.png`;
        
        tac = prettyString(tac, "first", false);

        try {
            const embed = embedGenerator.info({
                title: `You are ${tac}!`,
                image: {
                    url: tacimage,
                },
            }).withAuthor(message.author);
            
            await message.reply({ embeds: [embed] });
        } catch (err) {
            return await message.reply({ embeds: [embedGenerator.error("An error occured")] });
        }
    },
};