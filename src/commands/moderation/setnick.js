const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setnick')
        .setDescription('Set a user\'s nickname')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('The user to change nickname for')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('nickname')
                .setDescription('The new nickname (leave empty to reset)')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames),
    
    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const newNickname = interaction.options.getString('nickname');
        
        // Check if the bot can manage nicknames
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageNicknames)) {
            return interaction.reply({ 
                content: 'I don\'t have permission to manage nicknames!', 
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
        
        // Check if the bot can manage the target's nickname
        if (!targetMember.manageable) {
            return interaction.reply({ 
                content: 'I cannot change this user\'s nickname! They may have a higher role than me.', 
                ephemeral: true 
            });
        }
        
        // Check if the user trying to change nickname has a higher role than the target
        if (interaction.member.roles.highest.position <= targetMember.roles.highest.position && 
            interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({ 
                content: 'You cannot change the nickname of this user as they have the same or higher role than you.', 
                ephemeral: true 
            });
        }
        
        try {
            // Get the old nickname
            const oldNickname = targetMember.nickname || targetUser.username;
            
            // Set the new nickname (or reset if none provided)
            await targetMember.setNickname(newNickname || null);
            
            // Create nickname embed
            const nickEmbed = new EmbedBuilder()
                .setColor(config.embedColor)
                .setTitle('Nickname Changed')
                .setDescription(`**${targetUser.tag}**'s nickname has been ${newNickname ? 'changed' : 'reset'}.`)
                .addFields(
                    { name: 'Old Nickname', value: oldNickname },
                    { name: 'New Nickname', value: newNickname || targetUser.username },
                    { name: 'Changed by', value: interaction.user.tag }
                )
                .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
                .setTimestamp();
            
            // Send confirmation
            await interaction.reply({ embeds: [nickEmbed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({ 
                content: `There was an error changing ${targetUser.tag}'s nickname: ${error.message}`, 
                ephemeral: true 
            });
        }
    },
};
