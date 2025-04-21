const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');
const fs = require('fs');
const path = require('path');

// In a real bot, you would use a database to store these settings
// For this example, we'll use a simple in-memory approach
const welcomeMessages = {
    default: 'Hey everyone! Please welcome {user} to the server! 🎉'
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcomemsg')
        .setDescription('Configure the welcome message for new members')
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Set a custom welcome message')
                .addStringOption(option =>
                    option.setName('message')
                        .setDescription('The welcome message. Use {user} to mention the new member')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('View the current welcome message'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset the welcome message to default'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'set') {
            const message = interaction.options.getString('message');

            // Save the custom welcome message
            // In a real bot, you would save this to a database
            welcomeMessages[interaction.guild.id] = message;

            // Create a preview of how the message will look
            const previewMessage = message.replace('{user}', `<@${interaction.user.id}>`);

            const response = `**Welcome Message Updated**\n\n` +
                `The welcome message has been updated successfully.\n\n` +
                `**New Message:**\n${message}\n\n` +
                `**Preview:**\n${previewMessage}\n\n` +
                `*Use {user} to mention the new member*`;

            await interaction.reply({ content: response });

        } else if (subcommand === 'view') {
            const currentMessage = welcomeMessages[interaction.guild.id] || welcomeMessages.default;
            const previewMessage = currentMessage.replace('{user}', `<@${interaction.user.id}>`);

            const response = `**Current Welcome Message**\n\n` +
                `**Message:**\n${currentMessage}\n\n` +
                `**Preview:**\n${previewMessage}\n\n` +
                `*Use {user} to mention the new member*`;

            await interaction.reply({ content: response });

        } else if (subcommand === 'reset') {
            // Reset to default
            delete welcomeMessages[interaction.guild.id];

            const response = `**Welcome Message Reset**\n\n` +
                `The welcome message has been reset to the default.\n\n` +
                `**Default Message:**\n${welcomeMessages.default}\n\n` +
                `**Preview:**\n${welcomeMessages.default.replace('{user}', `<@${interaction.user.id}>`)}\n\n` +
                `*Use {user} to mention the new member*`;

            await interaction.reply({ content: response });
        }
    },

    // Method to get the welcome message for a guild
    getWelcomeMessage(guildId) {
        return welcomeMessages[guildId] || welcomeMessages.default;
    }
};
