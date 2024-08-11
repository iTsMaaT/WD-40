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

- Easy to use
- Music playing ability
- Quick fixes upon finding bugs
- Slash commands
- and more!

# Adding to your server

1. You can follow this [link](https://discord.com/oauth2/authorize?client_id=1036485458827415633) to add the bot to your server.
2. The base prefix for text commands will be `>`
3. You can execute the `/help` command (or `>help`) to get a list of all commands.
4. Profit! If any issues arise, feel free to join the [support server](https://discord.gg/pqKE2QZrFM) and ask for help.
5. Alternatively, you can execute the `/suggestion` command (or `>suggestion`) to suggest a feature or a bug fix.

# Self-hosting

Good luck. 
1. Install [Node.js](https://nodejs.org/en/download/) v20.x LTS and latest version of [FFmpeg](https://ffmpeg.org/download.html).
2. Clone this repository and run `npm install` (use `npm install --legacy-peer-deps` if errors occur).
3. Configure `.env` file in the root directory with your bot token and client id (details in `.env.example`).

| Variable | Description |
| - | - |
| TOKEN | The bot token, which you can get from the [Discord Developer Portal](https://discord.com/developers/applications). |
| CLIENT_ID | The client ID of the bot, which you can get from the [Discord Developer Portal](https://discord.com/developers/applications). |
| GEMINI_TOKEN | The token for the Gemini AI API, which you can get from the [Gemini API](https://ai.google.dev/gemini-api/docs) website. |
| GEMINI_API_PROXY_URL | The URL for a US proxy, as Gemini API keys only work in the US. |
| PTERODACTYL_API_KEY | If hosting on Pterodactyl, the API key for your panel. |
| PTERODACTYL_URL | The URL for your panel. |
| PTERODACTYL_SERVER_ID | The ID of the server on your panel.
| VIRUS_TOTAL_API_KEY | The API key for the VirusTotal API, which you can get from the [VirusTotal](https://www.virustotal.com/) website. |
| STEAM_API_KEY | The API key for the Steam API, which you can get from the [Steam](https://steamcommunity.com/dev) website. |
| REDDIT_CLIENT_SECRET | The client secret for the Reddit API, which you can get from the [Reddit](https://www.reddit.com/prefs/apps) website. |
| REDDIT_CLIENT_ID | The client ID for the Reddit API, which you can get from the [Reddit](https://www.reddit.com/prefs/apps) website. |
| REDDIT_CLIENT_TOKEN | The refresh token for the Reddit API, which you can get from the [Reddit](https://www.reddit.com/prefs/apps) website. |
| YOUTUBE_ACCESS_STRING | The access string for the YouTube API, which you can get from executing `npx --no discord-player-youtubei` in your terminal ([more info](https://github.com/retrouser955/discord-player-youtubei)). |
| DATABASE_URL | The URL for the database, to create the DB, please refer to [DATABASE](#database) below.
| | |
| OWNER_ID | The ID of the owner of the bot. |
| STATUS_CHANNEL_ID | The ID of the channel where the bot will post status updates. |
| MEMBERS_UPDATE_ID | The ID of the channel where the bot will post member updates. |
| SUGGESTION_CHANNEL_ID | The ID of the channel where the bot will post suggestions from the `/suggestion` (`>suggestion`) command. |
| | |
| SERVER | Either `prod` or `dev`, will make the bot only react to it's owner on dev. |

> Reddit client secret, ID and token are optional, as it will use the normal API instead of going trough OAUTH if not specified.

4. Set up the database.

# Database

The bot uses a MySQL database to store data. You can create a database by running the following command:

```sql
CREATE DATABASE bot;
```

# Help and support

If you need help, feel free to join the [support server](https://discord.gg/pqKE2QZrFM) and ask for help.

[JavaScript-Badge]: https://img.shields.io/badge/JavaScript-%23323330.svg?style=flat&logo=javascript&logoColor=%23F7DF1E
[JavaScript-Url]: https://en.wikipedia.org/wiki/JavaScript "JavaScript"