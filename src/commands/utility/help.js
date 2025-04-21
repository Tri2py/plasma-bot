const { SlashCommandBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display a list of available commands')
        .addStringOption(option =>
            option.setName('category')
                .setDescription('The category of commands to view')
                .setRequired(false)
                .addChoices(
                    { name: 'Moderation', value: 'moderation' },
                    { name: 'Utility', value: 'utility' }
                )),

    async execute(interaction) {
        const category = interaction.options.getString('category');

        // If a category is specified, show commands for that category
        if (category) {
            return this.showCategoryCommands(interaction, category);
        }

        // Otherwise, show the main help menu
        const helpMessage = `**Bot Help Menu**\n\n` +
            `Select a category from the dropdown menu below to view available commands.\n\n` +
            `**Moderation:** Commands for server moderation\n` +
            `**Utility:** Utility commands for server management\n\n` +
            `*Use /help [category] to directly view a specific category*`;

        // Create dropdown menu for categories
        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('help_category_select')
                    .setPlaceholder('Select a category')
                    .addOptions([
                        {
                            label: 'Moderation',
                            description: 'Commands for server moderation',
                            value: 'moderation',
                        },
                        {
                            label: 'Utility',
                            description: 'Utility commands for server management',
                            value: 'utility',
                        },
                    ]),
            );

        // Send the help menu
        await interaction.reply({ content: helpMessage, components: [row], ephemeral: true });

        // Create a collector for the dropdown menu
        const filter = i => i.customId === 'help_category_select' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            await this.showCategoryCommands(i, i.values[0]);
        });

        collector.on('end', async collected => {
            if (collected.size === 0) {
                // If the user didn't select anything, disable the dropdown
                row.components[0].setDisabled(true);
                await interaction.editReply({ components: [row] }).catch(() => {});
            }
        });
    },

    async showCategoryCommands(interaction, category) {
        // Get all command files in the category
        const commandsPath = path.join(__dirname, '..', category);
        const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

        // Create a message for the category
        let categoryMessage = `**${category.charAt(0).toUpperCase() + category.slice(1)} Commands**\n\n` +
            `Here are all the available commands in the ${category} category:\n\n`;

        // Add each command to the message
        for (const file of commandFiles) {
            const filePath = path.join(commandsPath, file);
            const command = require(filePath);

            if ('data' in command && 'execute' in command) {
                categoryMessage += `**/${command.data.name}** - ${command.data.description}\n`;
            }
        }

        // Check if it's a reply to the original help command or a dropdown interaction
        if (interaction.isStringSelectMenu()) {
            await interaction.update({ content: categoryMessage, components: [] });
        } else {
            await interaction.reply({ content: categoryMessage, ephemeral: true });
        }
    }
};
