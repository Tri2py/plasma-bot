const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vunmute')
        .setDescription('Unmute a user in voice channels')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user to voice unmute')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('reason')
                .setDescription('The reason for voice unmuting the user')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.MuteMembers),

    async execute(interaction) {
        const targetUser = interaction.options.getUser('user');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        // Check if the bot can mute members
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.MuteMembers)) {
            return interaction.reply({
                content: 'I don\'t have permission to unmute members in voice channels!',
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

        // Check if the user is already unmuted
        if (!targetMember.voice.mute) {
            return interaction.reply({
                content: 'This user is not voice muted!',
                ephemeral: true
            });
        }

        // Check if the user trying to voice unmute has a higher role than the target
        if (interaction.member.roles.highest.position <= targetMember.roles.highest.position &&
            interaction.user.id !== interaction.guild.ownerId) {
            return interaction.reply({
                content: 'You cannot voice unmute this user as they have the same or higher role than you.',
                ephemeral: true
            });
        }

        try {
            // Unmute the user in voice
            await targetMember.voice.setMute(false, `${reason} | Voice unmuted by ${interaction.user.tag}`);

            // Create voice unmute message
            const vunmuteMessage = `**User Voice Unmuted**\n\n` +
                `**${targetUser.tag}** has been unmuted in voice channels.\n\n` +
                `**Reason:** ${reason}\n` +
                `**Voice unmuted by:** ${interaction.user.tag}`;

            // Send confirmation
            await interaction.reply({ content: vunmuteMessage });

            // Try to DM the voice unmuted user
            try {
                const dmMessage = `**You've been voice unmuted in ${interaction.guild.name}**\n\n` +
                    `You have been unmuted in voice channels.\n` +
                    `**Reason**: ${reason}`;

                await targetUser.send({ content: dmMessage });
            } catch (error) {
                // Ignore if we can't DM the user
                console.log(`Could not DM user ${targetUser.tag}`);
            }
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: `There was an error voice unmuting ${targetUser.tag}: ${error.message}`,
                ephemeral: true
            });
        }
    },
};
