const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('untimeout')
        .setDescription('Remove timeout from a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to remove timeout from')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for removing the timeout')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if the bot can moderate members
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({
                content: 'I don\'t have permission to remove timeouts!',
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

        // Check if the user is timed out
        if (!targetMember.communicationDisabledUntil) {
            return interaction.reply({
                content: 'This user is not timed out!',
                ephemeral: true
            });
        }

        // Check if the user trying to remove timeout has a higher role than the target
        if (interaction.member.roles.highest.position <= targetMember.roles.highest.position &&
            interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({
                content: 'You cannot remove timeout from this user as they have the same or higher role than you.',
                ephemeral: true
            });
        }

        try {
            // Remove timeout
            await targetMember.timeout(null, `${reason} | Timeout removed by ${interaction.user.tag}`);

            // Create untimeout message
            const untimeoutMessage = `**User Timeout Removed**\n\n` +
                `**${targetUser.tag}**'s timeout has been removed.\n\n` +
                `**Reason:** ${reason}\n` +
                `**Timeout removed by:** ${interaction.user.tag}`;

            // Send confirmation
            await interaction.reply({ content: untimeoutMessage });

            // Try to DM the user
            try {
                const dmMessage = `**Your timeout has been removed in ${interaction.guild.name}**\n\n` +
                    `Your timeout has been removed.\n` +
                    `**Reason**: ${reason}`;

                await targetUser.send({ content: dmMessage });
            } catch (error) {
                // Ignore if we can't DM the user
                console.log(`Could not DM user ${targetUser.tag}`);
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: `There was an error removing timeout from ${targetUser.tag}: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
