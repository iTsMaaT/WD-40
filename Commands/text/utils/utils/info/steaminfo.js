const { SendErrorEmbed } = require("@functions/discordFunctions");
const prettyMilliseconds = require("pretty-ms");

module.exports = {
    name: "steaminfo",
    description: "Gives info about a steam account",
    category: "info",
    aliases: ["sinfo", "steam"],
    usage: "< [Steam ID]: id of the profile >",
    examples: ["76561198868461949"],
    async execute(logger, client, message, args) {
        if (!args[0]) return SendErrorEmbed(message, "You must provide a steam ID", "yellow");
        const steamID = args[0];
        let steamInfo;
        try {
            steamInfo = await getSteamInfo(steamID);
        } catch (err) {
            logger.error(err);
            return SendErrorEmbed(message, "Couldn't fetch steam info", "yellow");
        }

        const formattedGames = steamInfo.threeRecentGames.games.map((game, index) => `
        Game${index + 1}: **${game.name}**
        Total playtime: ${prettyMilliseconds(game.playtime_forever * 1000 * 60)}
        Playtime last 2 weeks: ${prettyMilliseconds(game.playtime_2weeks * 1000 * 60)}
        -
            `.replace(/^\s+/gm, "")).join("\n");

        let currentlyPlaying = "";
        if (steamInfo.userProfile.gameextrainfo) 
            currentlyPlaying = steamInfo.userProfile.gameextrainfo;

        const embed = {
            color: 0xffffff,
            thumbnail: {
                url: steamInfo.userProfile.avatarfull,
            },
            title: `Steam stats for ${steamInfo.userProfile.personaname}`,
            description: `
                **Profile**
                Real name: ${steamInfo.userProfile.realname}
                Created: <t:${steamInfo.userProfile.timecreated}:R>
                Profile URL: ${steamInfo.userProfile.profileurl}
                ---
                **Games**
                Owned games count: ${steamInfo.gameCount}
                Games played in the last 2 weeks: ${steamInfo.threeRecentGames.twoWeeksCount}
                ---
                **Three games last played** 
                ${formattedGames}
                ${currentlyPlaying ? `Currently playing : **${currentlyPlaying}**` : ""}
                `.replace(/^\s+/gm, ""),
            timestamp: new Date(),
        };
        
        message.reply({ embeds: [embed] });
    },
};

const getSteamInfo = async (steamID) => {
    const baseURL = "http://api.steampowered.com/";
    // console.log(await(await fetch(`${baseURL}IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamID}&format=json`)).text());
    const [allGames, recentGames, profile] = await Promise.all([
        await (await fetch(`${baseURL}IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamID}&format=json`)).json(),
        await (await fetch(`${baseURL}IPlayerService/GetRecentlyPlayedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamID}&count=3&format=json`)).json(),
        await (await fetch(`${baseURL}ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamID}&format=json`)).json(),
        // http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=C8F93CB635E0B5B50E2908C8698B04D4&steamid=76561197960434622&format=json
    ]);

    const gameCount = allGames.response.game_count;
    const threeRecentGames = {
        twoWeeksCount: recentGames.response.total_count,
        games: recentGames.response.games,
    }; 
    const userProfile = profile.response.players[0];

    return {
        gameCount,
        threeRecentGames,
        userProfile,
    };
};