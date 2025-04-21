const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invinfo')
        .setDescription('Get information about a specific invite code')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('The invite code to check')
                .setRequired(true)),

    async execute(interaction) {
        await interaction.deferReply();

        const inviteCode = interaction.options.getString('code');

        try {
            // Fetch the invite
            const invite = await interaction.guild.invites.fetch(inviteCode).catch(() => null);

            if (!invite) {
                return interaction.editReply({
                    content: `The invite code \`${inviteCode}\` is invalid or has expired.`,
                    ephemeral: true
                });
            }

            // Get invite creator
            const inviter = invite.inviter
                ? `${invite.inviter.tag} (${invite.inviter.id})`
                : 'Unknown';

            // Format creation and expiration dates
            const createdAt = invite.createdAt
                ? `<t:${Math.floor(invite.createdAt.getTime() / 1000)}:F>`
                : 'Unknown';

            const expiresAt = invite.expiresAt
                ? `<t:${Math.floor(invite.expiresAt.getTime() / 1000)}:R>`
                : 'Never';

            // Get target channel
            const targetChannel = invite.channel
                ? `<#${invite.channel.id}> (${invite.channel.name})`
                : 'Unknown';

            // Create invite info message
            let invInfoMessage = `**Invite Information: ${inviteCode}**\n\n` +
                `**Created By:** ${inviter}\n` +
                `**Created At:** ${createdAt}\n` +
                `**Expires:** ${expiresAt}\n` +
                `**Channel:** ${targetChannel}\n` +
                `**Uses:** ${invite.uses || 0}\n` +
                `**Max Uses:** ${invite.maxUses ? `${invite.maxUses}` : 'Unlimited'}\n` +
                `**Temporary:** ${invite.temporary ? 'Yes' : 'No'}\n` +
                `**URL:** ${invite.url}\n`;

            // Add guild info if it's an invite to another server
            if (invite.guild && invite.guild.id !== interaction.guild.id) {
                invInfoMessage += `\n**Target Server:** ${invite.guild.name}\n` +
                    `**Server ID:** ${invite.guild.id}\n` +
                    `**Member Count:** ${invite.memberCount || 'Unknown'}\n`;
            }

            invInfoMessage += `\n*Requested by ${interaction.user.tag}*`;

            // Send the message
            await interaction.editReply({ content: invInfoMessage });
        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: `There was an error fetching invite information: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
