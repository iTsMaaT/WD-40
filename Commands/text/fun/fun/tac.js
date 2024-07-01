const { prettyString } = require("@functions/formattingFunctions");
const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "tac",
    description: "Tells you which tetes a claque you are",
    category: "fun",
    aliases: ["tetesaclaque"],
    async execute(logger, client, message, args, found) {
        const tacs = ["fernand", "gabriel_samuel", "ginette_tony", "jimmy_rejean", "julie_simon", "les_chasseurs", "monique_lucien", "natacha", "oncleTom", "pilote", "raoul", "rene_charles", "ti_papoutes", "turcotte", "yvon"];
        const unchangedtac = ["les_chasseurs", "rene_charles", "ti_papoutes"];
        let tac = tacs[Math.floor(Math.random() * tacs.length)];
        const tacimage = `https://www.tetesaclaques.tv/public/images/series/fr-ca/${tac}.png`;
        
        if (tac == "oncleTom") tac = "oncle tom";
        if (tac == "rene_charles") tac = "Rene-Charles";
        if (tac == "pilote") tac = "le pilote";
        if (tac.includes("_") && !unchangedtac.includes(tac)) 
            tac = tac.split("_")[Math.floor(Math.random() * 2)];
        else if (tac.includes("_")) 
            tac = tac.replace("_", " ");
        
        tac = prettyString(tac, "first", false);

        try {
            const embed = {
                title: `You are ${tac}!`,
                image: {
                    url: tacimage,
                },
                color: 0xffffff,
                timestamp: new Date(),
            };
            
            message.reply({ embeds: [embed] });
        } catch (err) {
            return SendErrorEmbed(message, "An error occured", "red");
        }
    },
};