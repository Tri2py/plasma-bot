const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Timeout a user for a specified duration')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to timeout')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('duration')
                .setDescription('The duration of the timeout in minutes')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(40320)) // Max 28 days (40320 minutes)
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for the timeout')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const duration = interaction.options.getInteger('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if the bot can timeout members
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({
                content: 'I don\'t have permission to timeout members!',
                ephemeral: true
            });
        }

        // Get the target member
        const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

        // Check if the member exists and can be timed out
        if (!targetMember) {
            return interaction.reply({
                content: 'This user is not in the server!',
                ephemeral: true
            });
        }

        if (!targetMember.moderatable) {
            return interaction.reply({
                content: 'I cannot timeout this user! They may have a higher role than me or I don\'t have proper permissions.',
                ephemeral: true
            });
        }

        // Check if the user trying to timeout has a higher role than the target
        if (interaction.member.roles.highest.position <= targetMember.roles.highest.position) {
            return interaction.reply({
                content: 'You cannot timeout this user as they have the same or higher role than you.',
                ephemeral: true
            });
        }

        // Calculate timeout duration in milliseconds
        const timeoutDuration = duration * 60 * 1000; // Convert minutes to milliseconds

        // Format duration for display
        let formattedDuration;
        if (duration < 60) {
            formattedDuration = `${duration} minute${duration === 1 ? '' : 's'}`;
        } else if (duration < 1440) {
            const hours = Math.floor(duration / 60);
            const minutes = duration % 60;
            formattedDuration = `${hours} hour${hours === 1 ? '' : 's'}${minutes > 0 ? ` and ${minutes} minute${minutes === 1 ? '' : 's'}` : ''}`;
        } else {
            const days = Math.floor(duration / 1440);
            const hours = Math.floor((duration % 1440) / 60);
            formattedDuration = `${days} day${days === 1 ? '' : 's'}${hours > 0 ? ` and ${hours} hour${hours === 1 ? '' : 's'}` : ''}`;
        }

        // Create timeout message
        const timeoutMessage = `**User Timed Out**\n\n` +
            `**${targetUser.tag}** has been timed out for ${formattedDuration}.\n\n` +
            `**Reason:** ${reason}\n` +
            `**Timed out by:** ${interaction.user.tag}`;

        // Timeout the user
        try {
            await targetMember.timeout(timeoutDuration, `${reason} | Timed out by ${interaction.user.tag}`);

            // Send confirmation
            await interaction.reply({ content: timeoutMessage });

            // Try to DM the timed out user
            try {
                const dmMessage = `**You've been timed out in ${interaction.guild.name}**\n\n` +
                    `You have been timed out for ${formattedDuration}.\n` +
                    `**Reason**: ${reason}`;

                await targetUser.send({ content: dmMessage });
            } catch (error) {
                // Ignore if we can't DM the user
                console.log(`Could not DM user ${targetUser.tag}`);
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: `There was an error timing out ${targetUser.tag}: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
