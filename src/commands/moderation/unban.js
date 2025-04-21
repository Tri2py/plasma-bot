const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Unban a user from the server')
        .addStringOption(option =>
            option.setName('userid')
                .setDescription('The ID of the user to unban')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for unbanning the user')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

    async execute(interaction) {
        const userId = interaction.options.getString('userid');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if the bot can unban members
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
            return interaction.reply({
                content: 'I don\'t have permission to unban members!',
                ephemeral: true
            });
        }

        try {
            // Fetch ban info to check if the user is actually banned
            const banInfo = await interaction.guild.bans.fetch(userId).catch(() => null);

            if (!banInfo) {
                return interaction.reply({
                    content: 'This user is not banned!',
                    ephemeral: true
                });
            }

            // Unban the user
            await interaction.guild.members.unban(userId, `${reason} | Unbanned by ${interaction.user.tag}`);

            // Create unban message
            const unbanMessage = `**User Unbanned**\n\n` +
                `User with ID **${userId}** has been unbanned from the server.\n\n` +
                `**Reason:** ${reason}\n` +
                `**Unbanned by:** ${interaction.user.tag}`;

            // Send confirmation
            await interaction.reply({ content: unbanMessage });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: `There was an error unbanning the user: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
