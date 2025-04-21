const { Events, EmbedBuilder } = require('discord.js');
const config = require('../config');

module.exports = {
    name: Events.GuildMemberRemove,
    async execute(member) {
        // Use the same channel as welcome messages
        const channelId = '1204716299494891551';

        try {
            // Fetch the channel
            const channel = await member.guild.channels.fetch(channelId).catch(() => null);

            // If the channel doesn't exist, try to use the system channel as fallback
            if (!channel) {
                console.log(`Channel with ID ${channelId} not found. Trying system channel.`);
                if (member.guild.systemChannel) {
                    return this.sendLeaveMessage(member, member.guild.systemChannel);
                }
                return;
            }

            // Send leave message to the specified channel
            await this.sendLeaveMessage(member, channel);

        } catch (error) {
            console.error('Error in guildMemberRemove event:', error);
        }
    },

    async sendLeaveMessage(member, channel) {
        // Create a detailed leave message in plain text
        const leaveMessage = `**${member.user.tag}** has left the server.\n` +
            `We now have **${member.guild.memberCount}** members.\n` +
            `Goodbye and good luck!`;

        // Send a leave message as plain text
        await channel.send({
            content: leaveMessage
        });
    }
};
