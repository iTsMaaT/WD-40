# Changelog

## [5.4.1] - July 17, 2024

- Massive embed refactoring
- Help page has slash commands
- Blacklist (should) work for slash commands
- New source command

## [5.4.0] - July 17, 2024

- Fixed music again dammnit
- Better play response embed
- Hotfix to YouTube links containing 'list' search parameter not fetching and erroring out

## [5.3.1] - July 12, 2024

- Added Tidal and Deezer support for music
- Fixed music by using a new YT extractor (use SoundCloud links if any issues arise while I fix it)
- Added -pn to play, puts the song up next ([p]lay [n]ext)
- Removed Herobrine

## [5.3.0] - June 30, 2024

- Made dashed paramters usable anywhere
- Made command parameters more explicit in the help command (eg. help emote)
- userinfo can now be used with a username
- Bot asks for proper permissions upon joining a server
- Reddit commands now work (at least more than before)
- Switch bird, otter, and dog to use reddit
- New topic command, uses LDA to get the topic of the last X messages
- Refactoring

## [5.2.0] - April 6, 2024

- Fixed issues related to DB
- Cat command uses API instead of Reddit

## [5.1.0] - April 6, 2024

- Switched ask and asktts from PaLM to Gemini
- Added -s parameter to play (play <[link] -s) to shuffle before starting to play
- Fixed linkinfo

## [5.0.0] - November 7, 2023

- Massive refactoring
- Combined functions, better event handler, console commands
- Added /autoresponse: same as /autoreaction, but replies instead of reacting
- Removed `WD-40 is typing ...` for fast command (now is dynamic depending on the command execution time)
- After being auto-corrected by the bot for a typo, saying yes will execute the command
- Some activity statuses are now dynamically updated everyday
- Added <all parameter for auto-reactions
- Fixed duplicate emotes for auto-reactions
- New support server! | https://discord.gg/pqKE2QZrFM
- Activity status now look like a actual status (no `Playing ...`)
- gamer
- Music player now supports Soundgasm (why did you make me do this)
- Lots of fixes

## [4.11.0] - September 20, 2023

- /autoreaction: You can now configure auto-reactions to certain messages in certain channels
- Even more improvements to help
- some fixes to the stupid music plugin
- Lots of fixes

## [4.10.0] - Invalid Date

- ask: Switched from chatGPT to PaLM (Google AI), no need to jailbreak!
- blacklist: no permission argument gives the list of blacklists for the specified user
- help: Uses fields instead of the embed's description. Better limits
- moveall, deafenall and muteall: doesn't affect bots anymore
- Lots of fixes

## [4.9.0] - July 1, 2023

- Added new commands:
mps
New category: Text manipulation
- Moved brainfuck and alphfuck to Text Manipulation category
- Fixes

## [4.8.0] - July 1, 2023

- Added new commands:
tts
fakemessage
- Moved brainfuck and alphfuck to esolangs category
- Can now ping the bot instead of using prefix to execute a command, pinging without any argument will give the guild's prefix
- Fixes

## [4.7.0] - July 1, 2023

- Added new commands:
emojify
uwufy
- Added context commands:
Right click user  apps  userinfo
Right click message  apps  translate
- Fixes

## [4.6.1] - July 1, 2023

- Added new commands:
blacklist
brainfuck
alphuck
- Fixes

## [4.5.0] - June 29, 2023

- Added new commands:
moveall, deafenall, moveall
inviteinfo
- Fixes

## [4.4.0] - June 18, 2023

- Added new commands in the NSFW category
- Updated linkinfo
- Faster API requests for certain commands
- added aliases & cooldowns to certain commands
- Fixes

## [4.3.0] - June 13, 2023

- Added new commands:
mcskin: get the skin of a minecraft user
wikihow: get a random image from Wikihow
emote: easely add a emote/sticker to a server
linkinfo: analize a link
- Fixes

## [4.2.0] - June 6, 2023

- Added new command: stats
- Fixes

## [4.1.0] - May 29, 2023

- Added new slash command: /count
- Fixes

## [4.0.0] - May 29, 2023

- Added command usage: help -u
- Individual command help: help <command name
- Updates to database
- New music plugin and commands
- Fixes

## [3.5.0] - May 28, 2023

- New commands: botinfo and quote
- Fixes

## [3.4.0] - May 24, 2023

- New command: country
- Fixes

## [3.3.0] - May 22, 2023

- New commands: Advice, urban and guess (akinator)
- Fixes

## [3.2.0] - May 21, 2023

- New commands: Neko and Joke
- Fixes

## [3.1.0] - May 17, 2023

- Added lots of embeds
- Fixes

## [3.0.2] - May 16, 2023

- Function updates
- Fixes

## [3.0.0] - May 10, 2023

- Added a LOT of slash commands
- Fixes

## [2.6.4] - May 2, 2023

- Updated Help
- Fixes

## [2.5.3] - May 2, 2023

- Bug fixes and error handling in certain commands
- Ability to change the personality prompt per guild for ChatGPT
- Changed colors for the music embeds
- Fixed the music part of the bot
- help now has a page system

## [2.4.2] - April 29, 2023

- Refactoring
- Multiple new commands (cat, dog, minecraft, meme, fact)
- Completlely switched to a database system
- Auto-responses are now per guilds and disabled by default

## [2.3.1] - May 27, 2023

- Added context and Jailbreak to ChatGPT
- Added roll, can roll dices
- Added furry, you know what this is
- Multiple bug fixes and optimization

## [2.2.0] - May 26, 2023

- Added ChatGPT-3.5 (ask)
- Made the rule34 command fetch from rule34.xxx instead of Reddit
- Reddit command now can fetch a user post (help)
- Reddit and rule34 command now checks for NSFW channel
- Userinfo command also gives the highest level of the target user
- Added changelog

## [2.1.0] - May 21, 2023

- Added a database system
- Event handler

## [2.0.0] - February 12, 2023

- Added a dynamic help command
