# Discord Bot - Plasma Assistant

A Discord bot similar to ProBot built with Discord.js v14, featuring slash commands for moderation and utility functions.

## Features

- **Modern Discord.js v14 Implementation**
- **Slash Commands Support**
- **Moderation Commands:**
  - Ban users
  - Kick users
  - Timeout users
  - Clear messages
- **Utility Commands:**
  - User information
  - Server information
  - Help menu
  - Ping
- **Event Handlers:**
  - Welcome messages
  - Leave messages

## Prerequisites

- Node.js 16.9.0 or higher
- A Discord Bot Token ([Discord Developer Portal](https://discord.com/developers/applications))
- Discord Server with admin permissions

## Installation

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/plasma-assistant-bot.git
   cd plasma-assistant-bot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure the bot:
   - Create a `.env` file in the root directory and add your bot token:
     ```
     BOT_TOKEN=your_discord_bot_token_here
     ```
   - Open `src/config.js` and update the clientId and guildId with your own values:
     ```js
     module.exports = {
         token: process.env.BOT_TOKEN || 'your_discord_bot_token_here',
         clientId: 'your_client_id_here',
         guildId: 'your_test_guild_id_here',
         // other config options...
     };
     ```

4. Register slash commands:
   ```
   npm run deploy
   ```

5. Start the bot:
   ```
   npm start
   ```

## Creating a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name
3. Go to the "Bot" tab and click "Add Bot"
4. Under the "Privileged Gateway Intents" section, enable:
   - Server Members Intent
   - Message Content Intent
5. Copy the bot token and add it to your `.env` file
6. Go to the "OAuth2" tab, then "URL Generator"
7. Select the following scopes:
   - `bot`
   - `applications.commands`
8. Select the following bot permissions:
   - Administrator (or select specific permissions as needed)
9. Copy the generated URL and open it in your browser to invite the bot to your server

## Adding New Commands

1. Create a new command file in the appropriate category folder (e.g., `src/commands/utility/`)
2. Use the following template:

```js
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('command-name')
        .setDescription('Command description'),

    async execute(interaction) {
        // Command logic here
        await interaction.reply('Command response');
    },
};
```

3. Run `npm run deploy` to register the new command

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Discord.js](https://discord.js.org/)
- [ProBot](https://probot.io/) for inspiration
