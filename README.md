<h1 align="center">
    <br>
    WD-40 Discord Bot
    <br><br>
</h1>

<p align="center">
    <a href="https://discord.com/oauth2/authorize?client_id=1036485458827415633"><img src="https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&label=Add%20bot&labelColor=1b1c1d&logo=discord&logoColor=white&color=4c73df" alt="Add Cadence Discord bot"></a>&nbsp;
    <a href="https://discord.gg/pqKE2QZrFM"><img src="https://img.shields.io/badge/Discord-%235865F2.svg?style=for-the-badge&label=Support%20Server&labelColor=1b1c1d&logo=discord&logoColor=white&color=4c73df" alt="Discord support server"></a>&nbsp;
    <a href="https://github.com/iTsMaaT/WD-40/blob/develop/LICENSE"><img src="https://img.shields.io/github/license/mariusbegby/cadence-discord-bot?style=for-the-badge&label=License&labelColor=1b1c1d&logo=github&logoColor=white&color=4c73df" alt="WD-40 bot license"></a>
    <br>
</p>

<br>

## Table of Contents

- [Features](#features)
- [Adding to your server](#adding-to-your-server)
- [Self-hosting](#self-hosting)
- [Database](#database)
- [Help and support](#help-and-support)

[![JavaScript][JavaScript-Badge]][JavaScript-Url]

# Features

- Music playback from multiple sources (Spotify, Deezer, Youtube, and more)
- Text manipulation commands
- Fun games (Blackjack, Hangman, etc.)
- Auto-reactions and auto-responses
- Reddit integration
- AI features with Gemini
- Moderation tools
- Customizable per server

# Adding to your server

1. You can follow this [link](https://discord.com/oauth2/authorize?client_id=1036485458827415633) to add the bot to your server.
2. The base prefix for text commands will be `>`
3. You can execute the `/help` command (or `>help`) to get a list of all commands.
4. Profit! If any issues arise, feel free to join the [support server](https://discord.gg/pqKE2QZrFM) and ask for help.
5. Alternatively, you can execute the `/suggestion` command (or `>suggestion`) to suggest a feature or a bug fix.

# Self-hosting

Good luck. 

1. Add a bot app in the [Discord Developer Portal](https://discord.com/developers/applications) and get the token and client ID.
2. Make sure to enable all privileged intents in the bot app if you want full functionality.
3. Install [Node.js](https://nodejs.org/en/download/) v20.x LTS and latest version of [FFmpeg](https://ffmpeg.org/download.html).
4. Clone this repository and run `npm install` (use `npm install --legacy-peer-deps` if errors occur).
5. Configure `.env` file in the root directory with your bot token and client id (details in `.env.example`).

| Variable | Description |
| - | - |
| | |
| Required | - |
| TOKEN | The bot token, which you can get from the [Discord Developer Portal](https://discord.com/developers/applications). |
| DEV_TOKEN | The development bot token, which you can get from the [Discord Developer Portal](https://discord.com/developers/applications). |
| CLIENT_ID | The client ID of the bot, which you can get from the [Discord Developer Portal](https://discord.com/developers/applications). |
| SERVER | Either `prod` or `dev`, will make the bot only react to its owner on dev. |
| OWNER_ID | The ID of the owner of the bot. |
| CONFIG_FILEPATH | Override the default config file path. You can use `@root` to refer to the root directory of the project. |
| | |
| Optional | - |
| GEMINI_API_KEY | The token for the Gemini AI API, which you can get from the [Gemini API](https://ai.google.dev/gemini-api/docs) website. |
| PTERODACTYL_API_KEY | If hosting on Pterodactyl, the API key for your panel. |
| PTERODACTYL_URL | The URL for your panel. |
| PTERODACTYL_SERVER_ID | The ID of the server on your panel. |
| VIRUS_TOTAL_API_KEY | The API key for the VirusTotal API, which you can get from the [VirusTotal](https://www.virustotal.com/) website. |
| STEAM_API_KEY | The API key for the Steam API, which you can get from the [Steam](https://steamcommunity.com/dev) website. |
| REDDIT_CLIENT_SECRET | The client secret for the Reddit API, which you can get from the [Reddit](https://www.reddit.com/prefs/apps) website. |
| REDDIT_CLIENT_ID | The client ID for the Reddit API, which you can get from the [Reddit](https://www.reddit.com/prefs/apps) website. |
| REDDIT_REFRESH_TOKEN | The refresh token for the Reddit API, which you can get from the [Reddit](https://www.reddit.com/prefs/apps) website. |
| YOUTUBE_COOKIE | The cookie for the YouTube API, which you can get from executing `npx --no discord-player-youtubei` in your terminal ([more info](https://github.com/retrouser955/discord-player-youtubei)). |
| DEEZER_MASTER_KEY | The master key for the Deezer API. |
| DEEZER_ARL_COOKIE | Your deezer cookie. |
| DATABASE_URL | The URL for the database, to create the DB, please refer to [DATABASE](#database) below. |
| SENTRY_DSN | Sentry DSN to enable Sentry logging of ERROR/SEVERE/WARNING |
| SPOTIFY_CLIENT_ID | Your Spotify's app client ID. |
| SPOTIFY_CLIENT_SECRET | You Spotify's app client secret. |
| - | - |
| STATUS_CHANNEL_ID | The ID of the channel where the bot will post status updates. |
| MEMBERS_UPDATE_ID | The ID of the channel where the bot will post member updates. |
| SUGGESTION_CHANNEL_ID | The ID of the channel where the bot will post suggestions from the `/suggestion` (`>suggestion`) command. |
| GUILD_UPDATE_ID | The ID of the channel where the bot will post guild updates. |
| GUILD_BLACKLIST | A comma-separated list of guild IDs that the bot should leave immediately upon joining. |
| GLOBAL_BLACKLIST | A comma-separated list of user IDs that are globally blacklisted from using the bot. |
| SUPERUSER_WHITELIST | A comma-separated list of user IDs that have superuser permissions. |

> If eddit client secret, ID, and token are not configured, it will use the normal API instead of going through OAUTH if not specified.

## Add your own music library

If you wish to add your own library, make a music folder in the root of the project and add your files there, they will be used for query and spotify search and will be given as the first choice in the 10 choices list.

You can also configure the file extensions in the config file.

4. Set up the database.

# Database

The bot uses a MySQL database to store data. You can create a database by running the following command:

> TODO

## No Database Mode
As of version 5.8.0, you can run the bot without a database. Simply don't provide the `DATABASE_URL` in your `.env` file. Note that some features requiring persistence will be disabled in this mode.

# Help and support

If you need help, feel free to join the [support server](https://discord.gg/pqKE2QZrFM) and ask for help.

# Known issues

If you are hosting on a VPS and use Youtube for the music part, your IP might get blocked by YouTube as it systematically blocks IPs that are from a VPS, in this case, you can disable YouTube and use Deezer or SoundCloud instead by modifing the config in `utils/config/config.json`.

[JavaScript-Badge]: https://img.shields.io/badge/JavaScript-%23323330.svg?style=flat&logo=javascript&logoColor=%23F7DF1E
[JavaScript-Url]: https://en.wikipedia.org/wiki/JavaScript "JavaScript"