const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clearinv')
        .setDescription('Clear all invites from a user or the entire server')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to clear invites for (leave empty to clear all server invites)')
                .setRequired(false))
        .addStringOption(option => 
            option.setName('reason')
                .setDescription('The reason for clearing invites')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    
    async execute(interaction) {
        await interaction.deferReply();
        
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';
        
        // Check if the bot can manage guild
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.editReply({ 
                content: 'I don\'t have permission to manage server invites!', 
                ephemeral: true 
            });
        }
        
        try {
            // Fetch all invites from the guild
            const guildInvites = await interaction.guild.invites.fetch();
            
            // Filter invites if a user is specified
            const invitesToDelete = targetUser 
                ? guildInvites.filter(invite => invite.inviter && invite.inviter.id === targetUser.id)
                : guildInvites;
            
            if (invitesToDelete.size === 0) {
                return interaction.editReply({ 
                    content: targetUser 
                        ? `${targetUser.tag} has no active invites!` 
                        : 'There are no active invites in this server!', 
                    ephemeral: true 
                });
            }
            
            // Delete invites
            let deletedCount = 0;
            for (const invite of invitesToDelete.values()) {
                await invite.delete(`${reason} | Cleared by ${interaction.user.tag}`);
                deletedCount++;
            }
            
            // Create clear invites embed
            const clearInvitesEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('Invites Cleared')
                .setDescription(targetUser 
                    ? `Cleared **${deletedCount}** invites from **${targetUser.tag}**.`
                    : `Cleared **${deletedCount}** invites from the server.`)
                .addFields(
                    { name: 'Reason', value: reason },
                    { name: 'Cleared by', value: interaction.user.tag }
                )
                .setTimestamp();
            
            if (targetUser) {
                clearInvitesEmbed.setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));
            }
            
            // Send confirmation
            await interaction.editReply({ embeds: [clearInvitesEmbed] });
            
            // Try to DM the user if a specific user's invites were cleared
            if (targetUser && targetUser.id !== interaction.user.id) {
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor(config.embedColor)
                        .setTitle(`Your Invites in ${interaction.guild.name} Were Cleared`)
                        .setDescription(`All of your invites (${deletedCount}) have been cleared.\n**Reason**: ${reason}`)
                        .setTimestamp();
                    
                    await targetUser.send({ embeds: [dmEmbed] });
                } catch (error) {
                    // Ignore if we can't DM the user
                    console.log(`Could not DM user ${targetUser.tag}`);
                }
            }
        } catch (error) {
            console.error(error);
            await interaction.editReply({ 
                content: `There was an error clearing invites: ${error.message}`, 
                ephemeral: true 
            });
        }
    },
};
