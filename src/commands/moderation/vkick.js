const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vkick')
        .setDescription('Kick a user from a voice channel')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to kick from voice channel')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for voice kicking the user')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if the bot can move members
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.MoveMembers)) {
            return interaction.reply({
                content: 'I don\'t have permission to move members in voice channels!',
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

        // Check if the user is in a voice channel
        if (!targetMember.voice.channel) {
            return interaction.reply({
                content: 'This user is not in a voice channel!',
                ephemeral: true
            });
        }

        // Check if the user trying to voice kick has a higher role than the target
        if (interaction.member.roles.highest.position <= targetMember.roles.highest.position &&
            interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({
                content: 'You cannot voice kick this user as they have the same or higher role than you.',
                ephemeral: true
            });
        }

        try {
            // Store the voice channel name for the embed
            const voiceChannelName = targetMember.voice.channel.name;

            // Disconnect the user from voice
            await targetMember.voice.disconnect(`${reason} | Voice kicked by ${interaction.user.tag}`);

            // Create voice kick message
            const vkickMessage = `**User Voice Kicked**\n\n` +
                `**${targetUser.tag}** has been kicked from voice channel **${voiceChannelName}**.\n\n` +
                `**Reason:** ${reason}\n` +
                `**Voice kicked by:** ${interaction.user.tag}`;

            // Send confirmation
            await interaction.reply({ content: vkickMessage });

            // Try to DM the voice kicked user
            try {
                const dmMessage = `**You've been kicked from a voice channel in ${interaction.guild.name}**\n\n` +
                    `You were kicked from voice channel **${voiceChannelName}**.\n` +
                    `**Reason**: ${reason}`;

                await targetUser.send({ content: dmMessage });
            } catch (error) {
                // Ignore if we can't DM the user
                console.log(`Could not DM user ${targetUser.tag}`);
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: `There was an error voice kicking ${targetUser.tag}: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
