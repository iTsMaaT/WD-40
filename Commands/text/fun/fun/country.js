const { SendErrorEmbed } = require("@functions/discordFunctions");

module.exports = {
    name: "country",
    description: "See information about a country",
    usage: {
        required: {
            "country": "The country to see info of",
        },
    },
    category: "fun",
    examples: ["Canada"],
    execute(logger, client, message, args, optionalArgs) {
        if (!args[0]) return message.channel.send("No country provided");
        
        fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(args.slice(0).join(" "))}?fullText=true`)
            .then(async response => {
                const json = await response.json();

                if (json.status === "404") return SendErrorEmbed(message, "Couldn't find the specified country.", "red");

                const country = json[0];
                const currencies = Object.values(country.currencies).map(currency => `${currency.name} (${currency.symbol})`);
                const languages = Object.values(country.languages);

                const countryEmbed = {
                    color: 0xffffff,
                    title: country.name.common,
                    thumbnail: {
                        url: country.flags.png,
                    },
                    fields: [
                        { name: "Top level domain name", value: country.tld[0], inline: true },
                        { name: "Population", value: country.population, inline: true },
                        { name: "Independant", value: country.independent + " (" + country.status + ")", inline: true },
                        { name: "UN member", value: country.unMember, inline: true },
                        { name: "Currency", value: currencies.join(", "), inline: true },
                        { name: "Capital", value: country.capital[0], inline: true },
                        { name: "Continent", value: country.continents[0], inline: true },
                        { name: "Language(s)", value: languages.join(", ") },
                        { name: "Flag info", value: country.flags.alt },
                    ],
                    timestamp: new Date(),
                };

                if (country.coatOfArms) {
                    countryEmbed.thumbnail = {
                        url: country.coatOfArms.png,
                    };
                }

                message.channel.send({ embeds: [countryEmbed] });
            })
            .catch(error => {
                console.error("Error retrieving country information:", error);
                return SendErrorEmbed(message, "Couldn't fetch country infomations", "red");
            });
    },
};
