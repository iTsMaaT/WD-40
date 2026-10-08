const embedGenerator = require("@utils/helpers/embedGenerator");
const formatDuration = require("@utils/functions/formatDuration");

module.exports = {
    name: "steaminfo",
    description: "Gives info about a Steam account by username or profile URL",
    category: "info",
    aliases: ["steam"],
    usage: {
        required: {
            "username": "the Steam custom URL name or profile URL",
        },
    },
    examples: ["GabeNewell", "steamcommunity.com/id/GabeNewell"],
    requiredENVs: ["STEAM_API_KEY"],
    async execute(logger, client, message, args, flags) {
        if (!args[0]) {
            return await message.reply({
                embeds: [embedGenerator.warning("You must provide a Steam username or profile URL.")],
            });
        }

        let steamInfo;
        try {
            const steamID = await resolveSteamID(args[0]);
            if (!steamID) {
                return await message.reply({
                    embeds: [embedGenerator.warning("Couldn't find that Steam profile. Use its custom profile URL name, such as the part after `/id/` in its Steam profile URL.")],
                });
            }
            steamInfo = await getSteamInfo(steamID);
        } catch (err) {
            logger.error(err);
            return await message.reply({
                embeds: [embedGenerator.error("Couldn't fetch Steam info.")],
            });
        }

        if (!steamInfo.userProfile) {
            return await message.reply({
                embeds: [embedGenerator.warning("No profile found. Ensure the profile is public.")],
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

const resolveSteamID = async (input) => {
    const profileURL = input.match(/^(?:https?:\/\/)?(?:www\.)?steamcommunity\.com\/(id|profiles)\/([^/?#]+)\/?$/i);
    const profileType = profileURL?.[1].toLowerCase();
    const identifier = profileURL ? decodeURIComponent(profileURL[2]) : input;

    if (/^\d+$/.test(identifier))
        return identifier;

    if (profileType === "profiles")
        return null;

    const url = new URL("https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/");
    url.searchParams.set("key", process.env.STEAM_API_KEY);
    url.searchParams.set("vanityurl", identifier);

    const response = await fetch(url);
    if (!response.ok)
        throw new Error(`Steam profile lookup failed with status ${response.status}.`);

    const result = await response.json();
    return result.response?.success === 1 ? result.response.steamid : null;
};

const getSteamInfo = async (steamID) => {
    const baseURL = "https://api.steampowered.com/";
    const [allGames, recentGames, profile] = await Promise.all([
        await (await fetch(`${baseURL}IPlayerService/GetOwnedGames/v1/?key=${process.env.STEAM_API_KEY}&steamid=${steamID}&format=json`)).json(),
        await (await fetch(`${baseURL}IPlayerService/GetRecentlyPlayedGames/v1/?key=${process.env.STEAM_API_KEY}&steamid=${steamID}&count=3&format=json`)).json(),
        await (await fetch(`${baseURL}ISteamUser/GetPlayerSummaries/v2/?key=${process.env.STEAM_API_KEY}&steamids=${steamID}&format=json`)).json(),
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
