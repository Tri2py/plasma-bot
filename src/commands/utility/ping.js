const { SlashCommandBuilder } = require('discord.js');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Check the bot\'s latency and API response time'),

    async execute(interaction) {
        // Send initial response
        const sent = await interaction.reply({
            content: 'Pinging...',
            fetchReply: true
        });

        // Calculate round-trip latency
        const roundtripLatency = sent.createdTimestamp - interaction.createdTimestamp;

        // Get WebSocket heartbeat
        const wsHeartbeat = interaction.client.ws.ping;

        // Create ping message
        const pingMessage = `**🏓 Pong!**\n\n` +
            `**Bot Latency:** ${roundtripLatency}ms\n` +
            `**API Latency:** ${wsHeartbeat}ms`;

        // Edit the reply with the message
        await interaction.editReply({ content: pingMessage });
    },
};
