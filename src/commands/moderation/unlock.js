const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unlock')
        .setDescription('Unlock a channel to allow members to send messages')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to unlock (defaults to current channel)')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to unlock the channel for (defaults to @everyone)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for unlocking the channel')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        // Get options
        const channel = interaction.options.getChannel('channel') || interaction.channel;
        const role = interaction.options.getRole('role') || interaction.guild.roles.everyone;
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if the bot can manage channels
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({
                content: 'I don\'t have permission to manage channels!',
                ephemeral: true
            });
        }

        try {
            // Get current permissions for the role
            const currentPermissions = channel.permissionOverwrites.cache.get(role.id);

            // Check if the channel is already unlocked for this role
            if (!currentPermissions || !currentPermissions.deny.has(PermissionFlagsBits.SendMessages)) {
                return interaction.reply({
                    content: `The channel ${channel} is not locked for ${role.name}!`,
                    ephemeral: true
                });
            }

            // Update permissions to allow sending messages
            await channel.permissionOverwrites.edit(role, {
                SendMessages: null // Reset to default
            }, { reason: `${reason} | Unlocked by ${interaction.user.tag}` });

            // Create unlock message
            const unlockMessage = `**Channel Unlocked**\n\n` +
                `This channel has been unlocked for ${role.toString()}.\n\n` +
                `**Reason:** ${reason}\n` +
                `**Unlocked by:** ${interaction.user.tag}`;

            // Send confirmation to the command user
            await interaction.reply({
                content: `Successfully unlocked ${channel} for ${role.name}.`,
                ephemeral: true
            });

            // Send unlock notification in the unlocked channel
            await channel.send({ content: unlockMessage });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: `There was an error unlocking the channel: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
