const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Clear a specified number of messages from a channel')
        .addIntegerOption(option =>
            option.setName('amount')
                .setDescription('Number of messages to clear (1-100)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100))
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Only clear messages from this user')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        const amount = interaction.options.getInteger('amount');
        const user = interaction.options.getUser('user');

        // Check if the bot can manage messages
        if (!interaction.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) {
            return interaction.reply({
                content: 'I don\'t have permission to manage messages!',
                ephemeral: true
            });
        }

        // Defer the reply as bulk deletion might take some time
        await interaction.deferReply({ ephemeral: true });

        try {
            // Fetch messages
            const messages = await interaction.channel.messages.fetch({ limit: 100 });

            // Filter messages if a user is specified
            let filteredMessages;
            if (user) {
                filteredMessages = messages.filter(msg => msg.author.id === user.id).first(amount);
            } else {
                filteredMessages = messages.first(amount);
            }

            // Check if there are any messages to delete
            if (filteredMessages.length === 0) {
                return interaction.editReply({
                    content: user ? `No recent messages found from ${user.tag}!` : 'No messages found to delete!',
                    ephemeral: true
                });
            }

            // Check if messages are older than 14 days (Discord limitation)
            const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
            const messagesToDelete = filteredMessages.filter(msg => msg.createdTimestamp > twoWeeksAgo);

            if (messagesToDelete.length === 0) {
                return interaction.editReply({
                    content: 'All selected messages are older than 14 days and cannot be bulk deleted!',
                    ephemeral: true
                });
            }

            // Bulk delete messages
            const deleted = await interaction.channel.bulkDelete(messagesToDelete, true);

            // Create success message
            const successMessage = `**Messages Cleared**\n\n` +
                `Successfully deleted ${deleted.size} message${deleted.size === 1 ? '' : 's'}${user ? ` from ${user.tag}` : ''}.\n\n` +
                `*Requested by ${interaction.user.tag}*`;

            // Send confirmation
            await interaction.editReply({ content: successMessage });

            // Auto-delete the confirmation after 5 seconds
            setTimeout(async () => {
                try {
                    await interaction.deleteReply();
                } catch (error) {
                    console.error('Error deleting reply:', error);
                }
            }, 5000);
        } catch (error) {
            console.error(error);

            if (error.code === 50034) {
                await interaction.editReply({
                    content: 'Some messages are older than 14 days and cannot be bulk deleted!',
                    ephemeral: true
                });
            } else {
                await interaction.editReply({
                    content: `There was an error clearing messages: ${error.message}`,
                    ephemeral: true
                });
            }
        }
    },
};
