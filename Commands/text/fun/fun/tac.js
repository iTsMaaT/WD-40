const prettyString = require("@functions/prettyString.js");

module.exports = {
    name: "tac",
    description: "Tells you which tetes a claque you are",
    category: "fun",
    aliases: ['tetesaclaque'],
    async execute(logger, client, message, args) {
        const tacs = ["fernand","gabriel_samuel","ginette_tony","jimmy_rejean","julie_simon","les_chasseurs","monique_lucien","natacha","oncleTom","pilote","raoul","rene_charles","ti_papoutes","turcotte","yvon"];
        let tac = tacs[Math.floor(Math.random() * tacs.length)];
        const tacimage = `https://www.tetesaclaques.tv/public/images/series/fr-ca/${tac}.png`;
        
        if (tac == "oncleTom") tac = "oncle tom";
        if (tac.includes("_") && tac != "rene_charles") tac = tac.split("_")[Math.floor(Math.random() * 2)];
        tac = prettyString(tac, "first", false);

        const embed = {
            title: `You are ${tac}!`,
            image: {
                url: tacimage,
            },
            color: 0xffffff,
            timestamp: new Date(),
        };

        message.reply({ embeds: [embed] });
    },
};