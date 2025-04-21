const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Display a user\'s avatar')
        .addUserOption(option =>
            option.setName('user')
                .setDescription('The user whose avatar to display')
                .setRequired(false)),

    async execute(interaction) {
        // Get the target user (or the command user if no user is specified)
        const targetUser = interaction.options.getUser('user') || interaction.user;

        // Get the avatar URL
        const avatarURL = targetUser.displayAvatarURL({ dynamic: true, size: 4096 });

        // Create links to different formats
        let formatLinks = `[PNG](${targetUser.displayAvatarURL({ dynamic: false, format: 'png', size: 4096 })}) | ` +
            `[JPG](${targetUser.displayAvatarURL({ dynamic: false, format: 'jpg', size: 4096 })}) | ` +
            `[WEBP](${targetUser.displayAvatarURL({ dynamic: false, format: 'webp', size: 4096 })})`;

        // If the avatar is animated (GIF), add a link to the GIF format
        if (targetUser.avatar && targetUser.avatar.startsWith('a_')) {
            formatLinks += ` | [GIF](${targetUser.displayAvatarURL({ dynamic: true, format: 'gif', size: 4096 })})`;
        }

        // Create avatar message
        const avatarMessage = `**${targetUser.tag}'s Avatar**\n\n` +
            `${formatLinks}\n\n` +
            `${avatarURL}`;

        // Send the message
        await interaction.reply({ content: avatarMessage });
    },
};
