const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to ban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the ban')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('days')
                .setDescription('Number of days of messages to delete (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        const days = interaction.options.getInteger('days') || 0;

        // Check if the bot can ban members
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({
                content: 'I don\'t have permission to ban members!',
                ephemeral: true
            });
        }

        // Get the target member
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        // Check if the member exists and is bannable
        if (targetMember) {
            if (!targetMember.bannable) {
                return interaction.reply({
                    content: 'I cannot ban this user! They may have a higher role than me or I don\'t have proper permissions.',
                    ephemeral: true
                });
            }

            // Check if the user trying to ban has a higher role than the target
            if (interaction.member.roles.highest.position <= targetMember.roles.highest.position) {
                return interaction.reply({
                    content: 'You cannot ban this user as they have the same or higher role than you.',
                    ephemeral: true
                });
            }
        }

        // Create ban message
        const banMessage = `**User Banned**\n\n` +
            `**${targetUser.tag}** has been banned from the server.\n\n` +
            `**Reason:** ${reason}\n` +
            `**Banned by:** ${interaction.user.tag}`;

        // Ban the user
        try {
            await interaction.guild.members.ban(targetUser, {
                deleteMessageDays: days,
                reason: `${reason} | Banned by ${interaction.user.tag}`
            });

            // Send confirmation
            await interaction.reply({ content: banMessage });

            // Try to DM the banned user
            try {
                const dmMessage = `**You've been banned from ${interaction.guild.name}**\n\n` +
                    `**Reason**: ${reason}`;

                await targetUser.send({ content: dmMessage });
            } catch (error) {
                // Ignore if we can't DM the user
                console.log(`Could not DM user ${targetUser.tag}`);
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: `There was an error banning ${targetUser.tag}: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
