const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unmute')
        .setDescription('Unmute a user in the server')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to unmute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for unmuting the user')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if the bot can moderate members
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            return interaction.reply({
                content: 'I don\'t have permission to unmute members!',
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
                content: 'This user is not muted!',
                ephemeral: true
            });
        }

        try {
            // Remove timeout (unmute)
            await targetMember.timeout(null, `${reason} | Unmuted by ${interaction.user.tag}`);

            // Create unmute message
            const unmuteMessage = `**User Unmuted**\n\n` +
                `**${targetUser.tag}** has been unmuted.\n\n` +
                `**Reason:** ${reason}\n` +
                `**Unmuted by:** ${interaction.user.tag}`;

            // Send confirmation
            await interaction.reply({ content: unmuteMessage });

            // Try to DM the unmuted user
            try {
                const dmMessage = `**You've been unmuted in ${interaction.guild.name}**\n\n` +
                    `**Reason**: ${reason}`;

                await targetUser.send({ content: dmMessage });
            } catch (error) {
                // Ignore if we can't DM the user
                console.log(`Could not DM user ${targetUser.tag}`);
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: `There was an error unmuting ${targetUser.tag}: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
