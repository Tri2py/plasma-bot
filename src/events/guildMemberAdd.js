const { Events, EmbedBuilder } = require('discord.js');
const config = require('../config');
const welcomeMsgCommand = require('../commands/utility/welcomemsg');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        // Use the specific welcome channel ID
        const welcomeChannelId = '1204716299494891551';

        try {
            // Fetch the welcome channel
            const welcomeChannel = await member.guild.channels.fetch(welcomeChannelId).catch(() => null);

            // If the channel doesn't exist, try to use the system channel as fallback
            if (!welcomeChannel) {
                console.log(`Welcome channel with ID ${welcomeChannelId} not found. Trying system channel.`);
                if (member.guild.systemChannel) {
                    return this.sendWelcomeMessage(member, member.guild.systemChannel);
                }
                return;
            }

            // Send welcome message to the specified channel
            await this.sendWelcomeMessage(member, welcomeChannel);

        } catch (error) {
            console.error('Error in guildMemberAdd event:', error);
        }
    },

    async sendWelcomeMessage(member, channel) {
        // Get the custom welcome message or use default
        const welcomeMessage = welcomeMsgCommand.getWelcomeMessage(member.guild.id);

        // Replace {user} placeholder with the actual user mention
        const formattedMessage = welcomeMessage.replace('{user}', `${member.user}`);

        // Create a detailed welcome message in plain text
        const fullMessage = `${formattedMessage}\n\n` +
            `Welcome to **${member.guild.name}**! We're glad to have you here.\n` +
            `You are our **${member.guild.memberCount}${this.getNumberSuffix(member.guild.memberCount)}** member.`;

        // Send a welcome message as plain text
        await channel.send({
            content: fullMessage
        });
    },

    // Helper function to get the correct suffix for numbers
    getNumberSuffix(num) {
        const j = num % 10;
        const k = num % 100;
        if (j === 1 && k !== 11) {
            return 'st';
        }
        if (j === 2 && k !== 12) {
            return 'nd';
        }
        if (j === 3 && k !== 13) {
            return 'rd';
        }
        return 'th';
    }
    }
};
