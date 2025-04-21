const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invites')
        .setDescription('Show invite statistics for a user')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to check invites for (defaults to yourself)')
                .setRequired(false)),

    async execute(interaction) {
        await interaction.deferReply();

        // Get the target user (or the command user if no user is specified)
        const targetUser = interaction.options.getUser('user') || interaction.user;

        try {
            // Fetch all invites from the guild
            const guildInvites = await interaction.guild.invites.fetch();

            // Filter invites created by the target user
            const userInvites = guildInvites.filter(invite => invite.inviter && invite.inviter.id === targetUser.id);

            // Calculate total uses
            let totalUses = 0;
            userInvites.forEach(invite => {
                totalUses += invite.uses;
            });

            // Create invites message
            let invitesMessage = `**Invite Statistics for ${targetUser.tag}**\n\n` +
                `**Total Invites:** ${totalUses}\n` +
                `**Active Invite Links:** ${userInvites.size}\n`;

            // Add individual invite details if there are any
            if (userInvites.size > 0) {
                invitesMessage += `\n**Invite Details:**\n`;
                userInvites.forEach(invite => {
                    const expiresAt = invite.expiresAt
                        ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>`
                        : 'Never';

                    invitesMessage += `**Code:** ${invite.code} | **Uses:** ${invite.uses} | **Expires:** ${expiresAt}\n`;
                });

                // Truncate if too long
                if (invitesMessage.length > 1900) { // Discord message limit is 2000 chars
                    invitesMessage = invitesMessage.substring(0, 1897) + '...';
                }
            }

            invitesMessage += `\n*Requested by ${interaction.user.tag}*`;

            // Send the message
            await interaction.editReply({ content: invitesMessage });
        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: `There was an error fetching invites: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
