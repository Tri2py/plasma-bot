const { SlashCommandBuilder, ChannelType } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Display information about the server'),

    async execute(interaction) {
        const { guild } = interaction;

        // Fetch guild information
        await guild.fetch();

        // Get member count
        const totalMembers = guild.memberCount;

        // Get channel counts
        const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
        const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
        const categoryChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;
        const totalChannels = guild.channels.cache.size;

        // Get role count (excluding @everyone)
        const roleCount = guild.roles.cache.size - 1;

        // Get emoji count
        const emojiCount = guild.emojis.cache.size;

        // Get boost information
        const boostLevel = guild.premiumTier ? `Level ${guild.premiumTier}` : 'None';
        const boostCount = guild.premiumSubscriptionCount || 0;

        // Format creation date
        const createdAt = new Date(guild.createdTimestamp);
        const createdAtFormatted = `${createdAt.toLocaleDateString()} (${Math.floor((Date.now() - createdAt) / (1000 * 60 * 60 * 24))} days ago)`;

        // Get verification level
        let verificationLevel;
        switch (guild.verificationLevel) {
            case 0: verificationLevel = 'None'; break;
            case 1: verificationLevel = 'Low'; break;
            case 2: verificationLevel = 'Medium'; break;
            case 3: verificationLevel = 'High'; break;
            case 4: verificationLevel = 'Very High'; break;
            default: verificationLevel = 'Unknown';
        }

        // Create server info message
        let serverInfoMessage = `**Server Information - ${guild.name}**\n\n` +
            `**Server ID:** ${guild.id}\n` +
            `**Owner:** <@${guild.ownerId}>\n` +
            `**Created On:** ${createdAtFormatted}\n\n` +
            `**Members:** ${totalMembers}\n` +
            `**Channels:** ${totalChannels} (${textChannels} text, ${voiceChannels} voice, ${categoryChannels} categories)\n` +
            `**Roles:** ${roleCount}\n` +
            `**Emojis:** ${emojiCount}\n` +
            `**Boost Status:** ${boostLevel} (${boostCount} boosts)\n` +
            `**Verification Level:** ${verificationLevel}`;

        // Add server icon URL
        if (guild.icon) {
            serverInfoMessage += `\n\n**Server Icon:** ${guild.iconURL({ dynamic: true, size: 1024 })}`;
        }

        // Add server banner URL if available
        if (guild.banner) {
            serverInfoMessage += `\n\n**Server Banner:** ${guild.bannerURL({ size: 1024 })}`;
        }

        // Send the message
        await interaction.reply({ content: serverInfoMessage });
    },
};
