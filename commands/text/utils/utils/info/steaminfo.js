const embedGenerator = require("@utils/helpers/embedGenerator");
const formatDuration = require("@utils/functions/formatDuration");

module.exports = {
    name: "steaminfo",
    description: "Gives info about a steam account",
    category: "info",
    aliases: ["steam"],
    usage: {
        required: {
            "steamID": "the steam ID of the profile",
        },
    },
    examples: ["76561198868461949"],
    requiredENVs: ["STEAM_API_KEY"],
    async execute(logger, client, message, args, optionalArgs) {
        if (!args[0]) {
            return await message.reply({
                embeds: [embedGenerator.warning("You must provide a Steam ID.")],
            });
        }

        const steamID = args[0];
        let steamInfo;
        try {
            steamInfo = await getSteamInfo(steamID);
        } catch (err) {
            logger.error(err);
            return await message.reply({
                embeds: [embedGenerator.error("Couldn't fetch Steam info.")],
            });
        }

        if (!steamInfo.userProfile) {
            return await message.reply({
                embeds: [embedGenerator.warning("No profile found for the provided Steam ID. Ensure the profile is public.")],
            });
        }

        const formattedGames = steamInfo.threeRecentGames.games
            ? steamInfo.threeRecentGames.games.map((game, index) => `
                Game${index + 1}: **${game.name}**
                Total playtime: ${formatDuration(game.playtime_forever * 1000 * 60)}
                Playtime last 2 weeks: ${formatDuration(game.playtime_2weeks * 1000 * 60)}
                -
            `.replace(/^\s+/gm, "")).join("\n")
            : "No recent games found.";

        const currentlyPlaying = steamInfo.userProfile.gameextrainfo 
            ? `Currently playing: **${steamInfo.userProfile.gameextrainfo}**` 
            : "";

        const embed = {
            color: 0xffffff,
            thumbnail: {
                url: steamInfo.userProfile.avatarfull,
            },
            title: `Steam stats for ${steamInfo.userProfile.personaname}`,
            description: `
                **Profile**
                Real name: ${steamInfo.userProfile.realname || "-"}
                Created: ${steamInfo.userProfile.timecreated ? `<t:${steamInfo.userProfile.timecreated}:R>` : "-"}
                Profile URL: ${steamInfo.userProfile.profileurl || "-"}
                ---
                **Games**
                Owned games count: ${steamInfo.gameCount || 0}
                Games played in the last 2 weeks: ${steamInfo.threeRecentGames.twoWeeksCount || 0}
                ---
                **Three games last played** 
                ${formattedGames}
                ${currentlyPlaying}
            `.replace(/^\s+/gm, ""),
            timestamp: new Date(),
        };

        message.reply({ embeds: [embed] });
    },
};

const getSteamInfo = async (steamID) => {
    const baseURL = "http://api.steampowered.com/";
    const [allGames, recentGames, profile] = await Promise.all([
        await (await fetch(`${baseURL}IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamID}&format=json`)).json(),
        await (await fetch(`${baseURL}IPlayerService/GetRecentlyPlayedGames/v0001/?key=${process.env.STEAM_API_KEY}&steamid=${steamID}&count=3&format=json`)).json(),
        await (await fetch(`${baseURL}ISteamUser/GetPlayerSummaries/v0002/?key=${process.env.STEAM_API_KEY}&steamids=${steamID}&format=json`)).json(),
    ]);

    const gameCount = allGames.response?.game_count || 0;
    const threeRecentGames = {
        twoWeeksCount: recentGames.response?.total_count || 0,
        games: recentGames.response?.games || null,
    };

    const userProfile = profile.response?.players?.[0] || null;

    if (!userProfile) 
        throw new Error("No profile found or profile is private.");
    

    return {
        gameCount,
        threeRecentGames,
        userProfile,
    };
};
