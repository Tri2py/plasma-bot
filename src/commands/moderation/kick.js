const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Kick a user from the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the kick')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if the bot can kick members
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.KickMembers)) {
            return interaction.reply({
                content: 'I don\'t have permission to kick members!',
                ephemeral: true
            });
        }

        // Get the target member
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        // Check if the member exists and is kickable
        if (!targetMember) {
            return interaction.reply({
                content: 'This user is not in the server!',
                ephemeral: true
            });
        }

        if (!targetMember.kickable) {
            return interaction.reply({
                content: 'I cannot kick this user! They may have a higher role than me or I don\'t have proper permissions.',
                ephemeral: true
            });
        }

        // Check if the user trying to kick has a higher role than the target
        if (interaction.member.roles.highest.position <= targetMember.roles.highest.position) {
            return interaction.reply({
                content: 'You cannot kick this user as they have the same or higher role than you.',
                ephemeral: true
            });
        }

        // Create kick message
        const kickMessage = `**User Kicked**\n\n` +
            `**${targetUser.tag}** has been kicked from the server.\n\n` +
            `**Reason:** ${reason}\n` +
            `**Kicked by:** ${interaction.user.tag}`;

        // Try to DM the kicked user before kicking
        try {
            const dmMessage = `**You've been kicked from ${interaction.guild.name}**\n\n` +
                `**Reason**: ${reason}`;

            await targetUser.send({ content: dmMessage });
        } catch (error) {
            // Ignore if we can't DM the user
            console.log(`Could not DM user ${targetUser.tag}`);
        }

        // Kick the user
        try {
            await targetMember.kick(`${reason} | Kicked by ${interaction.user.tag}`);

            // Send confirmation
            await interaction.reply({ content: kickMessage });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: `There was an error kicking ${targetUser.tag}: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
