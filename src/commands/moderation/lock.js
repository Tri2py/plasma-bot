const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('Lock a channel to prevent members from sending messages')
        .addChannelOption(option =>
            option.setName('channel')
                .setDescription('The channel to lock (defaults to current channel)')
                .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement)
                .setRequired(false))
        .addRoleOption(option =>
            option.setName('role')
                .setDescription('The role to lock the channel for (defaults to @everyone)')
                .setRequired(false))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for locking the channel')
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

            // Check if the channel is already locked for this role
            if (currentPermissions && currentPermissions.deny.has(PermissionFlagsBits.SendMessages)) {
                return interaction.reply({
                    content: `The channel ${channel} is already locked for ${role.name}!`,
                    ephemeral: true
                });
            }

            // Update permissions to deny sending messages
            await channel.permissionOverwrites.edit(role, {
                SendMessages: false
            }, { reason: `${reason} | Locked by ${interaction.user.tag}` });

            // Create lock message
            const lockMessage = `**Channel Locked**\n\n` +
                `This channel has been locked for ${role.toString()}.\n\n` +
                `**Reason:** ${reason}\n` +
                `**Locked by:** ${interaction.user.tag}`;

            // Send confirmation to the command user
            await interaction.reply({
                content: `Successfully locked ${channel} for ${role.name}.`,
                ephemeral: true
            });

            // Send lock notification in the locked channel
            await channel.send({ content: lockMessage });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: `There was an error locking the channel: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
