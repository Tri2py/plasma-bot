const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vmove')
        .setDescription('Move a user to another voice channel')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to move')
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The voice channel to move the user to')
                .addChannelTypes(ChannelType.GuildVoice)
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for moving the user')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const targetChannel = interaction.options.getChannel('channel');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if the bot can move members
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.MoveMembers)) {
            return interaction.reply({
                content: 'I don\'t have permission to move members in voice channels!',
                ephemeral: true
            });
        }

        // Get the target member
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        // Check if the member exists
        if (!targetMember) {
            return interaction.reply({
                content: 'This user is not in the server!',
                ephemeral: true
            });
        }

        // Check if the user is in a voice channel
        if (!targetMember.voice.channel) {
            return interaction.reply({
                content: 'This user is not in a voice channel!',
                ephemeral: true
            });
        }

        // Check if the user is already in the target channel
        if (targetMember.voice.channelId === targetChannel.id) {
            return interaction.reply({
                content: 'This user is already in that voice channel!',
                ephemeral: true
            });
        }

        // Check if the user trying to move has a higher role than the target
        if (interaction.member.roles.highest.position <= targetMember.roles.highest.position &&
            interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({
                content: 'You cannot move this user as they have the same or higher role than you.',
                ephemeral: true
            });
        }

        try {
            // Store the original voice channel name for the embed
            const originalChannelName = targetMember.voice.channel.name;

            // Move the user to the target voice channel
            await targetMember.voice.setChannel(targetChannel.id, `${reason} | Moved by ${interaction.user.tag}`);

            // Create voice move message
            const vmoveMessage = `**User Moved**\n\n` +
                `**${targetUser.tag}** has been moved to a different voice channel.\n\n` +
                `**From Channel:** ${originalChannelName}\n` +
                `**To Channel:** ${targetChannel.name}\n` +
                `**Reason:** ${reason}\n` +
                `**Moved by:** ${interaction.user.tag}`;

            // Send confirmation
            await interaction.reply({ content: vmoveMessage });

            // Try to DM the moved user
            try {
                const dmMessage = `**You've been moved to a different voice channel in ${interaction.guild.name}**\n\n` +
                    `You have been moved from **${originalChannelName}** to **${targetChannel.name}**.\n` +
                    `**Reason**: ${reason}`;

                await targetUser.send({ content: dmMessage });
            } catch (error) {
                // Ignore if we can't DM the user
                console.log(`Could not DM user ${targetUser.tag}`);
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: `There was an error moving ${targetUser.tag}: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
